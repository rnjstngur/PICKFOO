from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [migrations.CreateModel(name='PointEntry', fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('kind', models.CharField(choices=[('earn','적립'),('spend','사용')], max_length=8)),
        ('amount', models.IntegerField()),
        ('label', models.CharField(max_length=160)),
        ('event_key', models.CharField(max_length=180, unique=True)),
        ('created_at', models.DateTimeField(auto_now_add=True)),
        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                   related_name='pickfoo_point_entries', to=settings.AUTH_USER_MODEL)),
    ], options={'ordering':['-created_at','-id']})]
