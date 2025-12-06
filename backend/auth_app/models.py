import hashlib

from django.db import models, IntegrityError
import uuid

class User(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4,
        primary_key=True,
        unique=True)
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=64)

class UsersManager(models.Manager):
    def create_secure_user(self, username, raw_password):
        user_id = uuid.uuid4()
        password_hash = hashlib.sha256(raw_password.encode()).hexdigest()
        try:
            return self.create(
                id=user_id,
                username=username,
                password=password_hash
            )
        except IntegrityError:
            return Users.objects.get(username=username) # не создаст крч
