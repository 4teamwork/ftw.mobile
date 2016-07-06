

.. contents:: Table of Contents




Introduction
============

With ``ftw.mobile`` you can implement mobile buttons, which shows a list of options on click.
The package needs ftw.theming, which provides the basic styles.

Plus it provides a mobile navigation, which is also displayed as a mobile button, but nbehaves completely different.

**ALPHA STATE: This software is currently under heavy development and the actual version may not be compatible with the final version.**


Installation
============

- Add the package to your buildout configuration:

::

    [instance]
    eggs +=
        ...
        ftw.mobile


Usage
=====

Two default buttons are registered by default.

- User Menu
- Navigation

Basically the buttons are rendered in a viewlet, which is visible at an certain viewport size.


Register new button
-------------------

Minimal example:

::

    from ftw.mobile.buttons import BaseButton


    class UserButton(BaseButton):

        def label(self):
            return u"User menu"

        def position(self):
            return 1000

        def data(self):
            """json data to display"""
            context_state = getMultiAdapter((self.context, self.request),
                                            name=u'plone_context_state')

            user_actions = context_state.actions('user')

            def link_data(item):
                return {'url': item.get('url'),
                        'label': item.get('title')}
            return map(link_data, user_actions)


You need to define at least the ``label``, the ``position`` and the ``data`` for a working mobile button.

Keep in mind, that the data method needs to return valid json data structure:

::

    [
        {
            "url": "$LINK_URL",
            "label": "$LINK_LABEL"
        },
        {
            "url": "$LINK_URL",
             "label": "$LINK_LABEL"
        }
    ]


The user button has the postion 1000 and is rendered most right position and the navigation has the position 100, which is on the most left side.

The navigation button is somehow special across his complexity. The navigation button is not considered a `simple` button ;-)


Details Navigation Button
-------------------------
TODO:
    - Some info about the nav button and its behavior.
    - Structure dependencies -> bierik?


Development
===========

**Python:**

1. Fork this repo
2. Clone your fork
3. Shell: ``ln -s development.cfg buidlout.cfg``
4. Shell: ``python boostrap.py``
5. Shell: ``bin/buildout``

Run ``bin/test`` to test your changes.

Or start an instance by running ``bin/instance fg``.

Links
=====

- Github: https://github.com/4teamwork/ftw.mobile
- Issues: https://github.com/4teamwork/ftw.mobile/issues
- Pypi: http://pypi.python.org/pypi/ftw.mobile
- Continuous integration: https://jenkins.4teamwork.ch/search?q=ftw.mobile

Copyright
=========

This package is copyright by `4teamwork <http://www.4teamwork.ch/>`_.

``ftw.mobile`` is licensed under GNU General Public License, version 2.
