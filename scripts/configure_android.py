r"""Android 개발 전용 모드 전환기. 개인/운영 비밀키를 앱에 넣지 마세요.
사용: py scripts\configure_android.py emulator
      py scripts\configure_android.py phone 192.168.0.10
      py scripts\configure_android.py packaged
구성 변경 뒤 항상 npm ci && npx cap sync android를 실행하세요.
"""
import json, sys, ipaddress
from pathlib import Path
root=Path(__file__).resolve().parent.parent
config=root/'capacitor.config.json'
base={'appId':'com.pickfoo.app','appName':'PICKFOO','webDir':'www',
      'server':{'androidScheme':'https'}}
args=sys.argv[1:]
if args==['emulator']:
    base['server'].update({'url':'http://10.0.2.2:8000','cleartext':True})
elif len(args)==2 and args[0]=='phone':
    ip=ipaddress.ip_address(args[1])
    if ip.version!=4 or not ip.is_private or ip.is_loopback or ip.is_link_local:
        raise SystemExit('phone 모드는 공유기 내부 IPv4 주소(예: 192.168.0.10)만 허용합니다.')
    base['server'].update({'url':f'http://{ip}:8000','cleartext':True})
elif args==['packaged']:
    pass
else:
    raise SystemExit(r'사용: py scripts\configure_android.py emulator | phone 192.168.0.10 | packaged')
config.write_text(json.dumps(base,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Capacitor 설정 변경:', args)
print('다음 명령: npm ci && npx cap sync android')
if args==['packaged']:
    print('주의: 패키징 모드는 www 화면만 내장합니다. 원격 Django 인증/DB 연동은 별도 배포·구현·검증이 필요합니다.')
else:
    print('주의: 이 모드는 로컬 개발·시연 전용으로, 배포용 서명 APK에 사용하지 마세요.')
