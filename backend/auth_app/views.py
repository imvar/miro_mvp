from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json


from django.shortcuts import render, redirect
from django.contrib.auth.hashers import make_password, check_password
from .forms import RegisterForm
from .models import User


def register(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            raw_password = form.cleaned_data["password"]
            user.password = make_password(raw_password)  # сюда попадёт algorithm$salt$hash
            user.save()
            return redirect("auth_login")
    else:
        form = RegisterForm()
    return render(request, "auth_app/register.html", {"form": form})


def login(request):
    error = None
    if request.method == "POST":
        login_value = request.POST.get("login")
        password = request.POST.get("password")
        try:
            user = User.objects.get(login=login_value)
        except User.DoesNotExist:
            user = None
        if user and check_password(password, user.password):
            # здесь обычно создают сессию, куку
            return redirect("auth_register")
        else:
            error = "Неверный логин или пароль"
    return render(request, "auth_app/login.html", {"error": error})

