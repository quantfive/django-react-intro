"""backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin

# Views
from server import views as index_views
from user import views as user_views

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
# ONLY UNCOMMENT the below ROUTER if you're using a DRF (django-rest-framework) viewset -- GenericViewSet or ModelViewSet

# ROUTER = SimpleRouter()

# User viewsets
# ROUTER.register(r'user', user_views.UserViews, base_name="user")

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^api/auth/', include('rest_auth.urls')),
    url(r'^api/auth/registration/', include('rest_auth.registration.urls')),
    # url(r'^api/', include(ROUTER.urls, namespace='api')),

    # This needs to be the last URL in order for pushState to work
    url(r'^', index_views.index, name="index"),
]
