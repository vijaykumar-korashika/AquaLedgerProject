from django.utils.text import slugify


def unique_slug(model, value, instance=None):
    base = (slugify(value) or "item")[:180]
    slug = base
    counter = 2
    qs = model.objects.all()
    if instance and instance.pk:
        qs = qs.exclude(pk=instance.pk)
    while qs.filter(slug=slug).exists():
        slug = f"{base}-{counter}"
        counter += 1
    return slug
