"""PICKFOO point and photo access regression tests (DB_ENGINE=sqlite works)."""
from io import BytesIO
from tempfile import TemporaryDirectory
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from catalog.models import Recipe, RecipeReview
from .models import PointEntry


class PointsApiTests(TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.media_override = override_settings(MEDIA_ROOT=self.tmp.name)
        self.media_override.enable()
        self.addCleanup(self.media_override.disable)
        user = get_user_model()
        self.alice = user.objects.create_user(username='alice@example.test',password='SafeTestPassword987!')
        self.bob = user.objects.create_user(username='bob@example.test',password='SafeTestPassword987!')
        self.recipe = Recipe.objects.create(created_by=self.alice,name='테스트 조합',category='분식',
                                            ingredients=['달걀'],steps=['섞기'],estimated_price=4200)
        self.review = RecipeReview.objects.create(user=self.alice,recipe=self.recipe,rating=5,content='맛있어요')
        self.client.force_login(self.alice)

    def photo(self):
        buf = BytesIO()
        Image.new('RGB',(16,16),(255, 190, 100)).save(buf,format='JPEG')
        return SimpleUploadedFile('test.jpg',buf.getvalue(),content_type='image/jpeg')

    def test_photo_rewards_only_once_even_after_replacing(self):
        path=f'/api/catalog/reviews/{self.review.pk}/photo/'
        result=self.client.post(path,{'photo':self.photo()})
        self.assertEqual(result.status_code,200,result.content)
        self.assertEqual(result.json()['points_awarded'],10)
        self.assertEqual(result.json()['points_balance'],10)
        result=self.client.post(path,{'photo':self.photo()})
        self.assertEqual(result.status_code,200,result.content)
        self.assertEqual(result.json()['points_awarded'],0)
        self.assertEqual(PointEntry.objects.filter(user=self.alice,kind='earn').count(),1)
        self.assertEqual(self.client.get('/api/points/').json()['balance'],10)

    def test_photo_access_is_private_and_other_account_cannot_upload(self):
        result=self.client.post(f'/api/catalog/reviews/{self.review.pk}/photo/', {'photo':self.photo()})
        self.assertEqual(result.status_code,200)
        url=result.json()['photo_url']
        from urllib.parse import urlsplit
        path=urlsplit(url).path
        self.assertEqual(self.client.get(path).status_code,200)
        self.client.force_login(self.bob)
        self.assertEqual(self.client.get(path).status_code,404)
        self.assertEqual(self.client.post(f'/api/catalog/reviews/{self.review.pk}/photo/',
                                          {'photo':self.photo()}).status_code,404)
        self.assertEqual(self.client.get('/api/points/').json()['balance'],0)

    def test_demo_exchange_is_server_side_and_cannot_overspend(self):
        self.assertEqual(self.client.post('/api/points/redeem/',data='{"product_id":"p1"}',
                                          content_type='application/json').status_code,409)
        PointEntry.objects.create(user=self.alice,kind='earn',amount=100,label='테스트 적립',event_key='test:one')
        response=self.client.post('/api/points/redeem/',data='{"product_id":"p1"}',
                                  content_type='application/json')
        self.assertEqual(response.status_code,200,response.content)
        self.assertEqual(response.json()['balance'],0)
        self.assertTrue(response.json()['demo_only'])
        self.assertEqual(self.client.post('/api/points/redeem/',data='{"product_id":"p1"}',
                                          content_type='application/json').status_code,409)

    def test_deleted_review_does_not_reset_uniqueness(self):
        self.client.post(f'/api/catalog/reviews/{self.review.pk}/photo/',{'photo':self.photo()})
        self.client.delete(f'/api/catalog/reviews/{self.review.pk}/')
        recreated=RecipeReview.objects.create(user=self.alice,recipe=self.recipe,rating=4,content='다시 작성')
        result=self.client.post(f'/api/catalog/reviews/{recreated.pk}/photo/',{'photo':self.photo()})
        self.assertEqual(result.status_code,200,result.content)
        self.assertEqual(result.json()['points_awarded'],0)
        self.assertEqual(self.client.get('/api/points/').json()['balance'],10)

    def test_photo_reward_is_limited_to_once_per_day(self):
        # 새 개인 조합을 계속 만들어 본인 사진 리뷰를 다는 방식의 반복 적립을 막는다.
        self.client.post(f'/api/catalog/reviews/{self.review.pk}/photo/',{'photo':self.photo()})
        second=Recipe.objects.create(created_by=self.alice,name='두번째 조합',category='분식',
                                     ingredients=['김'],steps=['섞기'],estimated_price=3000)
        review2=RecipeReview.objects.create(user=self.alice,recipe=second,rating=5,content='두번째')
        result=self.client.post(f'/api/catalog/reviews/{review2.pk}/photo/',{'photo':self.photo()})
        self.assertEqual(result.status_code,200,result.content)
        self.assertEqual(result.json()['points_awarded'],0)
        self.assertEqual(self.client.get('/api/points/').json()['balance'],10)

    def test_deleting_recipe_also_cleans_review_photo(self):
        self.client.post(f'/api/catalog/reviews/{self.review.pk}/photo/', {'photo':self.photo()})
        self.review.refresh_from_db()
        storage=self.review.photo.storage
        name=self.review.photo.name
        self.assertTrue(storage.exists(name))
        response=self.client.delete(f'/api/catalog/recipes/{self.recipe.pk}/')
        self.assertEqual(response.status_code,200,response.content)
        self.assertFalse(storage.exists(name))
