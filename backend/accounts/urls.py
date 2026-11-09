from django.urls import path
from . import views

urlpatterns = [
    # CSRF 토큰
    path('csrf/', views.csrf, name='csrf'),

    # 회원가입
    path('signup/', views.signup, name='signup'),

    # 로그인
    path('login/', views.login_api, name='login'),

    # 로그인 상태 확인
    path('me/', views.me, name='me'),

    # 로그아웃
    path('logout/', views.logout_api, name='logout'),

    # 음식 취향 저장 및 조회
    path('preferences/', views.preferences_api, name='preferences'),
]