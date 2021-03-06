#!/usr/bin/env python
# -*- coding: utf-8 -*-

###############################################################################
#  Copyright Kitware Inc.
#
#  Licensed under the Apache License, Version 2.0 ( the "License" );
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
###############################################################################

from girder.api import access
from girder.api.describe import Description
from girder.api.rest import getUrlParts

# A Quick implementation to call GetCapabilities
from owslib.wms import WebMapService

from girder.plugins.minerva.rest.source import Source
from girder.plugins.minerva.utility.minerva_utility import encryptCredentials


class WmsSource(Source):

    def __init__(self):
        self.resourceName = 'minerva_source_wms'
        self.route('POST', (), self.createWmsSource)

    @access.user
    def createWmsSource(self, params):
        name = params['name']
        baseURL = params['baseURL']
        parsedUrl = getUrlParts(baseURL)
        hostName = parsedUrl.netloc
        username = params['username'] if 'username' in params else None
        password = params['password'] if 'password' in params else None
        wms = WebMapService(baseURL, version='1.1.1',
                            username=username,
                            password=password
                            )
        layersType = list(wms.contents)
        layers = []
        for layerType in layersType:
            layer = {
                'layer_title': wms[layerType].title,
                'layer_type': layerType
            }
            layers.append(layer)

        minerva_metadata = {
            'source_type': 'wms',
            'layers': layers,
            'wms_params': {
                'base_url': baseURL,
                'host_name': hostName
            }
        }
        if username and password:
            credentials = encryptCredentials("{}:{}".format(
                username, password))
            minerva_metadata['wms_params']['credentials'] = credentials
        desc = 'wms source for  %s' % name
        return self.createSource(name, minerva_metadata, desc)
    createWmsSource.description = (
        Description('Create a source from an external wms server.')
        .responseClass('Item')
        .param('name', 'The name of the wms source', required=True)
        .param('baseURL', 'URL where the wms is served', required=True)
        .param('username', 'geoserver username', required=False)
        .param('password', 'geoserver password', required=False)
        .errorResponse('Write permission denied on the source folder.', 403))
