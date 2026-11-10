"""STEP256 photo review points regressions. Run with DB_ENGINE=sqlite for tests."""
from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image

from catalog.curated_models import CuratedCombo, CuratedComboReview
from catalog.models import Recipe, RecipeReview
from points.models import PointEntry


class PhotoRewardStep256Tests(TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.settings_ctx = override_settings(
            MEDIA_ROOT=self.tmp.name,
            STORAGES={
                'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
                'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
            },
        )
        self.settings_ctx.enable()
        self.addCleanup(self.settings_ctx.disable)
        user = get_user_model()
        self.owner = user.objects.create_user(username='photo-owner@example.test', password='TestPass987!')
        self.reviewer = user.objects.create_user(username='photo-reviewer@example.test', password='TestPass987!')
        self.combo = CuratedCombo.objects.create(key='pf-curated-01', name='첫 번째 추천', created_by=self.owner)
        self.review = CuratedComboReview.objects.create(
            combo=self.combo, user=self.reviewer, rating=5, content='정말 맛있어요')
        self.client.force_login(self.reviewer)

    @staticmethod
    def photo():
        buf = BytesIO()
        Image.new('RGB', (32, 32), (121, 188, 92)).save(buf, format='JPEG')
        return SimpleUploadedFile('food.jpg', buf.getvalue(), content_type='image/jpeg')

    def send_photo(self, review):
        return self.client.post(f'/api/catalog/curated/reviews/{review.pk}/photo/', {'photo': self.photo()})

    def balance(self):
        return self.client.get('/api/points/').json()['balance']

    def test_curated_photo_upload_awards_ten_once(self):
        self.assertEqual(self.balance(), 0)
        first = self.send_photo(self.review)
        self.assertEqual(first.status_code, 200, first.content)
        self.assertEqual(first.json()['points_awarded'], 10)
        self.assertEqual(first.json()['points_balance'], 10)
        self.assertEqual(self.balance(), 10)
        again = self.send_photo(self.review)
        self.assertEqual(again.status_code, 200, again.content)
        self.assertEqual(again.json()['points_awarded'], 0)
        self.assertEqual(self.balance(), 10)
        self.assertEqual(PointEntry.objects.filter(user=self.reviewer, kind='earn').count(), 1)

    def test_different_curated_combo_can_earn_again_same_day(self):
        combo2 = CuratedCombo.objects.create(key='pf-curated-02', name='두 번째 추천', created_by=self.owner)
        review2 = CuratedComboReview.objects.create(combo=combo2, user=self.reviewer, rating=4, content='좋네요')
        self.assertEqual(self.send_photo(self.review).json()['points_awarded'], 10)
        self.assertEqual(self.send_photo(review2).json()['points_awarded'], 10)
        self.assertEqual(self.balance(), 20)

    def test_no_reward_without_valid_photo(self):
        self.assertEqual(self.balance(), 0)
        bad_file = SimpleUploadedFile('fake.jpg', b'not-an-image', content_type='image/jpeg')
        res = self.client.post(f'/api/catalog/curated/reviews/{self.review.pk}/photo/', {'photo': bad_file})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(self.balance(), 0)

    def test_curated_other_user_cannot_upload_or_earn(self):
        self.client.force_login(self.owner)
        res = self.client.post(f'/api/catalog/curated/reviews/{self.review.pk}/photo/', {'photo': self.photo()})
        self.assertEqual(res.status_code, 404)
        self.assertEqual(self.balance(), 0)

    def test_regular_recipe_rewards_once_per_combo_not_once_per_day(self):
        recipe1 = Recipe.objects.create(created_by=self.reviewer, name='레시피 A', category='간편식', ingredients=['계란'], steps=['섞기'])
        recipe2 = Recipe.objects.create(created_by=self.reviewer, name='레시피 B', category='간편식', ingredients=['치즈'], steps=['섞기'])
        r1 = RecipeReview.objects.create(user=self.reviewer, recipe=recipe1, rating=5, content='맛있음')
        r2 = RecipeReview.objects.create(user=self.reviewer, recipe=recipe2, rating=4, content='좋음')
        def upload(review):
            return self.client.post(f'/api/catalog/reviews/{review.pk}/photo/', {'photo': self.photo()})
        self.assertEqual(upload(r1).json()['points_awarded'], 10)
        self.assertEqual(upload(r1).json()['points_awarded'], 0)
        self.assertEqual(upload(r2).json()['points_awarded'], 10)
        self.assertEqual(self.balance(), 20)

    def test_existing_regular_reward_key_stays_idempotent(self):
        recipe = Recipe.objects.create(created_by=self.reviewer, name='기존 적립 레시피', category='간편식', ingredients=['치즈'], steps=['섞기'])
        r = RecipeReview.objects.create(user=self.reviewer, recipe=recipe, rating=5, content='평가')
        PointEntry.objects.create(user=self.reviewer, kind='earn', amount=10, label='기존 사진 리뷰',
                                  event_key=f'photo:{self.reviewer.pk}:{recipe.pk}')
        result = self.client.post(f'/api/catalog/reviews/{r.pk}/photo/', {'photo': self.photo()})
        self.assertEqual(result.status_code, 200, result.content)
        self.assertEqual(result.json()['points_awarded'], 0)
        self.assertEqual(self.balance(), 10)
