from django.urls import path
from . import views
urlpatterns = [
    path('', views.point_summary, name='point-summary'),
    path('redeem/', views.redeem, name='point-redeem'),
]
