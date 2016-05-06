from ftw.mobile.interfaces import IMobileButton
from ftw.mobile.tests import FunctionalTestCase
from ftw.testbrowser import browsing
from zope.component import getMultiAdapter
import json


class TestUserButton(FunctionalTestCase):

    def setUp(self):
        super(TestUserButton, self).setUp()

    @browsing
    def test_viewlet_is_available(self, browser):
        browser.login().visit()

        self.assertTrue(browser.css('.ftw-mobile-buttons'),
                        'Expect the ftw mobile viewlet on the site.')
