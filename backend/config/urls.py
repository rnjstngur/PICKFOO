from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponseRedirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/catalog/', include('catalog.urls')),
    path('api/points/', include('points.urls')),
    path('', lambda request: HttpResponseRedirect('/index.html')),
]
# The frontend files at /index.html, /style.css, /app.js, ... are served
# by WhiteNoise from www/; review photos never use a public /media/ route.
