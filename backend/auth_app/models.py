from django.db import models

class User(models.Model):
    login = models.CharField(max_length=150, unique=True)
    # Строка вида: алгоритм$salt$hash, например: pbkdf2_sha256$<salt>$<hash>
    password = models.CharField(max_length=256)

    def __str__(self):
        return self.login