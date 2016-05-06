from ftw.mobile.interfaces import IMobileButton
from ftw.mobile.tests import FunctionalTestCase
from ftw.testbrowser import browsing
from zope.component import getMultiAdapter
import json


class TestUserButton(FunctionalTestCase):

    def setUp(self):
        super(TestUserButton, self).setUp()

        self.user_button = getMultiAdapter((self.portal, self.request),
                                           IMobileButton,
                                           name="user-mobile-button")

    def test_user_button_label(self):
        self.assertEquals('User menu', self.user_button.label())

    def test_user_button_data_url(self):
        self.assertEquals('', self.user_button.data_url())

    def test_user_button_data_template(self):
        self.assertEquals('ftw-mobile-list-template',
                          self.user_button.data_template())

    def test_user_button_position(self):
        self.assertEquals(10, self.user_button.position())

    def test_user_button_data(self):
        expect = [
            {u'url': u'http://nohost/plone/dashboard',
             u'label': u'Dashboard'},
            {u'url': u'http://nohost/plone/@@personal-preferences',
             u'label': u'Preferences'},
            {u'url': u'http://nohost/plone/logout',
             u'label': u'Log out'}, ]
        self.assertEquals(expect, json.loads((self.user_button.data())))

    @browsing
    def test_user_button_rendering(self, browser):
        html = self.user_button.render_button()
        browser.open_html(html)

        link = browser.css('a').first

        self.assertEquals(u'User menu', link.text)
        self.assertEquals(u'#', link.attrib['href'])
        self.assertEquals(u'', link.attrib['data-mobileurl'])

        self.assertTrue(
            isinstance(json.loads(link.attrib['data-mobiledata']), list),
            'Expect valid json data in mobile-data')
