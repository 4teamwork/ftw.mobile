from plone import api
from Products.CMFPlone.browser.navigation import get_view_url
from Products.Five.browser import BrowserView
import os


def is_external_link(brain):
    if brain.portal_type == 'Link':
        url = brain.getRemoteUrl
        return not url.startswith(api.portal.get().absolute_url())
    else:
        return False


def get_path_depth(brain):
    portal_url = '/'.join(api.portal.get().getPhysicalPath())
    return len(brain.getPath().replace(portal_url, '').split('/')) - 1


class MobileNavigation(BrowserView):
    """Compute navigation based on global settings and some given paramters.
    The return value is always a nested structure, which can be represented
    as json.

    Node representation:
     {'title': '<String>',
      'description': '<String>',
      'id' <String>:
      'childrenIds': '<List> of <String>s',
      'url': '<String>',
      'externallink': '<Boolean>',
      'nodes': '<List> of nodes'}
    """

    def __init__(self, context, request):
        super(MobileNavigation, self).__init__(context, request)

        self.startpath = None
        self.depth = None

    def __call__(self):
        tree = make_tree_by_url(map(self.brain_to_node, self.get_brains()))
        return tree

    def get_brains(self):
        catalog = api.portal.get_tool('portal_catalog')
        return [brain for brain in catalog(self.get_query())
                if not brain.exclude_from_nav]

    def get_query(self):
        portal_types = api.portal.get_tool('portal_types')
        portal_properties = api.portal.get_tool('portal_properties')
        navtree_properties = getattr(portal_properties, 'navtree_properties')

        exclude_types = getattr(navtree_properties, 'metaTypesNotToList', None)
        include_types = list(set(portal_types.keys()) - set(exclude_types))

        sort_on = getattr(navtree_properties,
                          'sortAttribute',
                          'getObjPositionInParent')

        sort_order = getattr(navtree_properties,
                             'sortOrder',
                             'asc')

        query = {'portal_type': include_types,
                 'sort_on': sort_on,
                 'sort_order': sort_order,
                 'is_default_page': False}
        return query

    def brain_to_node(self, brain):
        return {'title': brain.Title,
                'id': brain.id,
                'description': brain.Description,
                'url': get_view_url(brain)[1],
                'externallink': is_external_link(brain),
                'depth': get_path_depth(brain)}


def make_tree_by_url(nodes):
    """Creates a nested tree of nodes from a flat list-like object of nodes.
    Each node is expected to be a dict with a url-like string stored
    under the key ``url``.
    Each node will end up with a ``nodes`` key, containing a list
    of children nodes.
    The nodes are changed in place, be sure to make copies first when
    necessary.
    """

    for node in nodes:
        node['nodes'] = []
        node['childrenIds'] = []

    nodes_by_url = dict((node['url'], node) for node in nodes)
    root = {'nodes': [],
            'childrenIds': []}

    for node in nodes:
        parent_url = os.path.dirname(node['url'])
        if parent_url in nodes_by_url:
            nodes_by_url[parent_url]['nodes'].append(node)
            nodes_by_url[parent_url]['childrenIds'].append(node['id'])
        else:
            root['nodes'].append(node)
            root['childrenIds'].append(node['id'])

    return root


def tree_size(nodes_or_node):
    if isinstance(nodes_or_node, list):
        return sum(map(tree_size, nodes_or_node))
    return sum(map(tree_size, nodes_or_node.get('nodes', []))) + 1
