from ftw.mobile.interfaces import IMobileButton
from ftw.mobile.tests import FunctionalTestCase
from ftw.testbrowser import browsing
from zope.component import getMultiAdapter
import json
import transaction


class TestMultilingualButton(FunctionalTestCase):

    supportedLanguages = ['de', 'fr', 'en']

    def set_lang(self, lang='de'):
        self.ltool.manage_setLanguageSettings(
            lang, self.supportedLanguages,
            setUseCombinedLanguageCodes=False)

    def setUp(self):
        super(TestMultilingualButton, self).setUp()

        self.grant('Manager')
        self.button = getMultiAdapter((self.portal, self.request),
                                      IMobileButton,
                                      name="multilanguage-mobile-button")

        self.ltool = self.portal.portal_languages

        self.set_lang()
        self.request['LANGUAGE'] = 'de'

        transaction.commit()

    def tearDown(self):
        self.ltool.setLanguageBindings()

    def test_label(self):
        import pdb; pdb.set_trace()
        self.assertEquals(u'de', self.button.label())

    def test_data_template(self):
        self.assertEquals('ftw-mobile-list-template',
                          self.button.data_template())

    def test_position(self):
        self.assertEquals(300, self.button.position())

    def test_data(self):
        expect = [
            {'url': u'http://nohost/plone?set_language=de',
             'label': u'Deutsch'},
            {'url': u'http://nohost/plone?set_language=fr',
             'label': u'Fran\xe7ais'},
            {'url': u'http://nohost/plone?set_language=en',
             'label': u'English'}, ]
        self.assertEquals(expect, (self.button.data()))

    @browsing
    def test_rendering(self, browser):
        html = self.button.render_button()
        browser.open_html(html)

        link = browser.css('a').first

        self.assertEquals(u'de', link.text)
        self.assertEquals(u'#', link.attrib['href'])
        self.assertEquals(u'', link.attrib['data-mobile_endpoint'])
        self.assertEquals(u'', link.attrib['data-mobile_startup_cachekey'])
        self.assertEquals(u'ftw-mobile-list-template',
                          link.attrib['data-mobile_template'])

        self.assertTrue(
            isinstance(json.loads(link.attrib['data-mobile_data']), list),
            'Expect valid json data in mobile-data')
