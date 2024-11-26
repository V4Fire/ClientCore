# build/webpack/plugins/async-chunks-plugin

This module provides a plugin that gathers information about asynchronous chunks and modifies the webpack runtime to load asynchronous modules from shadow storage in fat-html.

## Gathering Information

During the initial phase, the plugin gathers information about all emitted asynchronous chunks. This information is stored in a JSON file within the output directory and later used to inline those scripts into the HTML using a special template tag.

## Patching the Webpack Runtime

The plugin replaces the standard RuntimeGlobals.loadScript script. The new script attempts to locate a template tag with the ID of the chunk name and adds the located script to the page. If there is no such template with the script, the standard method is called to load the chunk from the network.

