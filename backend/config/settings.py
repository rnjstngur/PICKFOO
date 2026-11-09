"""PICKFOO local development and hosted backend settings.
Required: DJANGO_SECRET_KEY and PostgreSQL DB_* values or DATABASE_URL.
SQLite is supported ONLY for local automated tests via DB_ENGINE=sqlite.
"""
from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent
load_dotenv(BASE_DIR / '.env')

def env_bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in ('true','1','yes','on')

def env_list(name, fallback=''):
    return [item.strip() for item in os.getenv(name, fallback).split(',') if item.strip()]

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError('DJANGO_SECRET_KEY를 backend/.env 또는 호스팅 환경변수에 설정하세요.')
DEBUG = env_bool('DJANGO_DEBUG', True)
ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost,10.0.2.2' if DEBUG else '')
if not DEBUG and not ALLOWED_HOSTS:
    raise RuntimeError('운영환경에는 DJANGO_ALLOWED_HOSTS 값을 설정하세요.')

INSTALLED_APPS = [
    'django.contrib.admin','django.contrib.auth','django.contrib.contenttypes',
    'django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles',
    'corsheaders','accounts','catalog','points',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],
              'APP_DIRS':True,'OPTIONS':{'context_processors':[
              'django.template.context_processors.request','django.contrib.auth.context_processors.auth',
              'django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'config.wsgi.application'

if os.getenv('DB_ENGINE') == 'sqlite':
    DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3',
                             'NAME': BASE_DIR / 'test_local.sqlite3'}}
elif os.getenv('DATABASE_URL'):
    import dj_database_url
    DATABASES = {'default': dj_database_url.config(conn_max_age=600,
                                                   conn_health_checks=True,
                                                   ssl_require=env_bool('DATABASE_SSL_REQUIRE', False))}
else:
    DATABASES = {'default': {'ENGINE':'django.db.backends.postgresql',
                            'NAME':os.getenv('DB_NAME','pickfoo_db'),
                            'USER':os.getenv('DB_USER','postgres'),
                            'PASSWORD':os.getenv('DB_PASSWORD',''),
                            'HOST':os.getenv('DB_HOST','127.0.0.1'),
                            'PORT':os.getenv('DB_PORT','5432')}}
    if os.getenv('DB_SSLMODE'):
        DATABASES['default']['OPTIONS'] = {'sslmode':os.getenv('DB_SSLMODE')}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
LANGUAGE_CODE='ko-kr'
TIME_ZONE='Asia/Seoul'
USE_I18N=True
USE_TZ=True
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'

STATIC_URL='/static/'
STATIC_ROOT=BASE_DIR/'staticfiles'
# Serve www/*.html, *.js and *.css on the SAME host as /api during hosted/dev-app mode.
WHITENOISE_ROOT=PROJECT_DIR/'www'
STORAGES = {'default': {'BACKEND':'django.core.files.storage.FileSystemStorage'},
            'staticfiles': {'BACKEND':'whitenoise.storage.CompressedManifestStaticFilesStorage'}}
MEDIA_URL='/media/'
MEDIA_ROOT=BASE_DIR/'media'
if os.getenv('PICKFOO_MEDIA_STORAGE','local').lower() == 's3':
    # Private objects; access to reviews is checked by the Django image-view endpoint.
    STORAGES['default']={
        'BACKEND':'storages.backends.s3.S3Storage',
        'OPTIONS':{'bucket_name':os.getenv('AWS_STORAGE_BUCKET_NAME'),
                   'region_name':os.getenv('AWS_S3_REGION_NAME') or None,
                   'endpoint_url':os.getenv('AWS_S3_ENDPOINT_URL') or None,
                   'access_key':os.getenv('AWS_ACCESS_KEY_ID') or None,
                   'secret_key':os.getenv('AWS_SECRET_ACCESS_KEY') or None,
                   'default_acl':None,
                   'querystring_auth':True,
                   'file_overwrite':False,
                   'custom_domain':None},
    }

CORS_ALLOWED_ORIGINS=env_list('DJANGO_CORS_ORIGINS',
                               'http://127.0.0.1:8765,http://localhost:8765' if DEBUG else '')
CORS_ALLOW_CREDENTIALS=True
CSRF_TRUSTED_ORIGINS=env_list('DJANGO_CSRF_TRUSTED_ORIGINS',
                              'http://127.0.0.1:8765,http://localhost:8765' if DEBUG else '')
SESSION_COOKIE_SECURE=not DEBUG
CSRF_COOKIE_SECURE=not DEBUG
SESSION_COOKIE_HTTPONLY=True
SECURE_CONTENT_TYPE_NOSNIFF=True
# Only trust proxy HTTPS headers when explicitly enabled by the hosting provider.
if env_bool('DJANGO_TRUST_PROXY_HTTPS',False):
    SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO','https')
