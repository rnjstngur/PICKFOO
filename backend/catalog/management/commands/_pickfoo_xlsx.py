"""Small, dependency-free reader for the four PICKFOO data sheets in .xlsx.

Uses the Python standard library only. This is NOT a general Excel engine:
macros, cell formulas and outside-workbook links are not evaluated.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
import posixpath
import re
import xml.etree.ElementTree as ET
from zipfile import BadZipFile, ZipFile

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"

COLUMNS = {
    "브랜드": (
        "브랜드명 (필수)", "브랜드 종류 (필수)", "공식 홈페이지 URL",
    ),
    "재료": ("재료명 (필수)", "재료 설명"),
    "메뉴": (
        "브랜드명 (필수)", "메뉴명 (필수)", "음식 종류", "메뉴 설명",
        "가격(원)", "정보 출처 URL", "판매 상태", "정보 확인 날짜 (YYYY-MM-DD)",
    ),
    "메뉴_재료": (
        "브랜드명 (필수)", "메뉴명 (필수)", "재료명 (필수)",
        "재료 정보 출처 URL", "재료 정보 확인 날짜 (YYYY-MM-DD)",
    ),
}


class ExcelImportError(ValueError):
    pass


def _tag(local: str) -> str:
    return "{" + MAIN + "}" + local


def _column_index(cell_ref: str) -> int:
    col = re.match(r"^[A-Z]+", cell_ref)
    if not col:
        raise ExcelImportError("엑셀 셀 좌표를 읽을 수 없습니다: " + cell_ref)
    result = 0
    for char in col.group(0):
        result = result * 26 + ord(char) - 64
    return result - 1


def _read_xml(zf: ZipFile, filename: str) -> ET.Element:
    try:
        info = zf.getinfo(filename)
        if info.file_size > 15_000_000:
            raise ExcelImportError(f"엑셀 내부 파일이 너무 큽니다: {filename}")
        return ET.fromstring(zf.read(filename))
    except KeyError as error:
        raise ExcelImportError(f"엑셀 내부 파일이 없습니다: {filename}") from error
    except ET.ParseError as error:
        raise ExcelImportError(f"엑셀 XML을 읽을 수 없습니다: {filename}") from error


def _shared_strings(zf: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = _read_xml(zf, "xl/sharedStrings.xml")
    return ["".join(t.text or "" for t in si.iter(_tag("t")))
            for si in root.findall(_tag("si"))]


def _decode_cell(cell: ET.Element, strings: list[str], sheet: str) -> str:
    if cell.find(_tag("f")) is not None:
        raise ExcelImportError(
            f"{sheet}!{cell.get('r')}: 수식 셀은 가져올 수 없습니다. 값으로 붙여넣어 주세요."
        )
    cell_type = cell.get("t", "n")
    if cell_type == "inlineStr":
        inline = cell.find(_tag("is"))
        return "".join(x.text or "" for x in inline.iter(_tag("t"))) if inline is not None else ""
    value = cell.find(_tag("v"))
    raw = value.text if value is not None and value.text else ""
    if cell_type == "s":
        try:
            return strings[int(raw)]
        except (IndexError, ValueError) as error:
            raise ExcelImportError(f"{sheet}!{cell.get('r')}: 문자열 인덱스 오류") from error
    if cell_type == "e":
        raise ExcelImportError(f"{sheet}!{cell.get('r')}: 엑셀 오류 값({raw})을 수정해 주세요.")
    if cell_type == "b":
        return "TRUE" if raw == "1" else "FALSE"
    return raw


def _read_rows(zf: ZipFile, path: str, sheet: str, strings: list[str]) -> list[tuple[int, list[str]]]:
    root = _read_xml(zf, path)
    rows: list[tuple[int, list[str]]] = []
    width = len(COLUMNS[sheet])
    data = root.find(_tag("sheetData"))
    if data is None:
        return rows
    for line in data.findall(_tag("row")):
        row_number = int(line.get("r", "0"))
        if row_number <= 0:
            continue
        fields = [""] * width
        for cell in line.findall(_tag("c")):
            index = _column_index(cell.get("r", ""))
            value = _decode_cell(cell, strings, sheet).strip()
            if index >= width:
                if value:
                    raise ExcelImportError(
                        f"{sheet}!{cell.get('r')}: 정의된 입력 열 밖에 데이터가 있습니다."
                    )
                continue
            fields[index] = value
        if any(fields):
            rows.append((row_number, fields))
            if len(rows) > 20_000:
                raise ExcelImportError(f"{sheet}: 한 시트는 최대 2만 행까지 가져올 수 있습니다.")
    if not rows:
        raise ExcelImportError(f"'{sheet}' 시트가 비어 있습니다.")
    header_row, headers = rows[0]
    if header_row != 1 or tuple(headers) != COLUMNS[sheet]:
        raise ExcelImportError(
            f"'{sheet}' 시트의 첫 번째 행 제목이 원본 양식과 다릅니다. "
            "열 이름이나 순서를 변경하지 마세요."
        )
    return rows[1:]


def read_pickfoo_xlsx(path: str | Path) -> dict[str, list[tuple[int, list[str]]]]:
    path = Path(path)
    if not path.is_file():
        raise ExcelImportError(f"엑셀 파일이 없습니다: {path}")
    if path.suffix.lower() != ".xlsx":
        raise ExcelImportError(".xlsx 파일만 지원합니다.")
    if path.stat().st_size > 25_000_000:
        raise ExcelImportError("엑셀 파일 크기는 25MB 이하여야 합니다.")
    try:
        with ZipFile(path) as zf:
            workbook = _read_xml(zf, "xl/workbook.xml")
            relations = _read_xml(zf, "xl/_rels/workbook.xml.rels")
            targets = {el.get("Id"): el.get("Target") for el in relations.findall("{" + PKG_REL + "}Relationship")}
            paths: dict[str, str] = {}
            for sheet in workbook.findall(".//" + _tag("sheet")):
                name = sheet.get("name", "")
                if name not in COLUMNS:
                    continue
                target = targets.get(sheet.get("{" + DOC_REL + "}id"))
                if not target:
                    raise ExcelImportError(f"'{name}' 시트 주소를 찾을 수 없습니다.")
                if target.startswith("/"):
                    source = target.lstrip("/")
                else:
                    source = posixpath.normpath(posixpath.join("xl", target))
                if not source.startswith("xl/worksheets/"):
                    raise ExcelImportError(f"'{name}' 시트의 파일 위치가 올바르지 않습니다.")
                paths[name] = source
            missing = sorted(set(COLUMNS) - set(paths))
            if missing:
                raise ExcelImportError("필수 시트가 없습니다: " + ", ".join(missing))
            strings = _shared_strings(zf)
            return {name: _read_rows(zf, paths[name], name, strings) for name in COLUMNS}
    except (BadZipFile, OSError) as error:
        raise ExcelImportError("엑셀 파일을 열 수 없습니다. 손상 여부를 확인해 주세요.") from error


def parse_excel_date(value: str, sheet: str, row: int, field: str):
    """Convert literal YYYY-MM-DD or Excel 1900-epoch serial to a date."""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        pass
    try:
        num = float(value)
        if 30_000 <= num <= 100_000 and num.is_integer():
            return (datetime(1899, 12, 30) + timedelta(days=int(num))).date()
    except ValueError:
        pass
    raise ExcelImportError(
        f"{sheet} {row}행 '{field}': 날짜는 YYYY-MM-DD 형식으로 입력해 주세요."
    )
