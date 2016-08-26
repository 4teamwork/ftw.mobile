from ftw.mobile.buttons import BaseButton
from plone import api
from plone.app.multilingual.browser.selector import addQuery
from plone.app.multilingual.browser.selector import getPostPath
from zope.component import queryAdapter

try:
    from plone.app.multilingual.interfaces import ITG  # plone.app.multilingual 2.x
except ImportError:
    from plone.multilingual.interfaces import ITG  # plone.app.multilingual 1.x

try:
    from plone.app.multilingual.interfaces import NOTG  # plone.app.multilingual 2.x
except ImportError:
    from plone.multilingual.interfaces import NOTG  # plone.app.multilingual 1.x


class MultilanguageButton(BaseButton):

    def __init__(self, context, request):
        super(MultilanguageButton, self).__init__(context, request)
        self.tool = api.portal.get_tool('portal_languages')
        self.portal_url = api.portal.get().absolute_url  # No call!
        self.buttons = self.get_buttons()

    def available(self):
        """
        Only render the button if there is more than one language configured
        in Plone because it does not make sense to render the button if
        the user has no other language to switch to.
        """
        return len(self.buttons) > 1

    def data(self):
        return self.buttons

    def label(self):
        return api.portal.get_current_language()

    def position(self):
        return 300

    def get_buttons(self):
        translation_languages = self.get_translation_languages()
        return [
            dict(url=language['url'], label=language['native'])
            for language in translation_languages
        ]

    def get_translation_languages(self):
        """
        Returns a list of dicts containing information about the translations
        of the context.

        This method has been copied from plone.app.multilingual 1.2.2
        (plone.app.multilingual.browser.selector.LanguageSelectorViewlet#languages).

        Example of one language item in the list:

            {
                'code': u'de',
                'flag': u'/++resource++country-flags/de.gif',
                'name': u'German',
                'native': u'Deutsch',
                'selected': True,
                'translated': True,
                'url': u'http://localhost:8080/platform/@@multilingual-selector/b70908f702cf4e168233ea635f25afc1/de?post_path=/view&set_language=de'
            }
        """
        languages_info = self.get_supported_languages()
        results = []
        translation_group = queryAdapter(self.context, ITG)
        if translation_group is None:
            translation_group = NOTG
        for lang_info in languages_info:
            # Avoid to modify the original language dict
            data = lang_info.copy()
            data['translated'] = True
            query_extras = {
                'set_language': data['code'],
            }
            post_path = getPostPath(self.context, self.request)
            if post_path:
                query_extras['post_path'] = post_path
            data['url'] = addQuery(
                self.request,
                self.portal_url().rstrip("/") + \
                "/@@multilingual-selector/%s/%s" % (
                    translation_group,
                    lang_info['code']
                ),
                **query_extras
            )
            results.append(data)
        return results

    def get_supported_languages(self):
        """
        Returns a list of supported languages.

        This method has been copied from plone.app.i18n 2.0.3
        (plone.app.i18n.locales.browser.selector.LanguageSelector#languages).

        Example of one language item in the list:

            {
                'code': u'fr',
                'flag': u'/++resource++country-flags/fr.gif',
                'name': u'French',
                'native': u'Fran\xe7ais',
                'selected': False,
            }
        """
        if self.tool is None:
            return []

        bound = self.tool.getLanguageBindings()
        current = bound[0]

        def merge(lang, info):
            info["code"] = lang
            if lang == current:
                info['selected'] = True
            else:
                info['selected'] = False
            return info

        languages = [merge(lang, info) for (lang, info) in
                     self.tool.getAvailableLanguageInformation().items()
                     if info["selected"]]

        # sort supported languages by index in portal_languages tool
        supported_langs = self.tool.getSupportedLanguages()

        def index(info):
            try:
                return supported_langs.index(info["code"])
            except ValueError:
                return len(supported_langs)

        return sorted(languages, key=index)
