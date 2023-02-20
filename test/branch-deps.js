// jscs:disable
goog.addDependency('../../../../src/0_jsonparse.js', ['safejson'], ['goog.json']);
goog.addDependency('../../../../src/0_queue.js', ['task_queue'], []);
goog.addDependency('../../../../src/1_utils.js', ['utils'], ['config', 'goog.json', 'safejson'], {'lang': 'es6'});
goog.addDependency('../../../../src/2_resources.js', ['resources'], ['config', 'utils']);
goog.addDependency('../../../../src/2_session.js', ['session'], ['goog.json', 'safejson', 'storage', 'utils']);
goog.addDependency('../../../../src/2_storage.js', ['storage'], ['goog.json', 'utils']);
goog.addDependency('../../../../src/3_api.js', ['Server'], ['goog.json', 'safejson', 'storage', 'utils']);
goog.addDependency('../../../../src/6_branch.js', ['Branch'], ['Server', 'config', 'goog.json', 'resources', 'safejson', 'session', 'storage', 'task_queue', 'utils']);
goog.addDependency('../../../../src/7_initialization.js', ['branch_instance'], ['Branch', 'config']);
goog.addDependency('../../../../src/extern.js', [], []);
goog.addDependency('../../../../src/onpage.js', [], []);
goog.addDependency('../../../../test/0_queue.js', [], ['task_queue']);
goog.addDependency('../../../../test/1_utils.js', [], ['utils'], {'lang': 'es6'});
goog.addDependency('../../../../test/2_storage.js', [], ['storage']);
goog.addDependency('../../../../test/3_api.js', [], ['Server', 'config', 'resources', 'safejson', 'storage', 'utils']);
goog.addDependency('../../../../test/6_branch.js', [], ['Branch', 'config', 'goog.json', 'resources', 'safejson', 'session', 'storage', 'utils']);
goog.addDependency('../../../../test/7_integration.js', [], ['config', 'goog.json']);
goog.addDependency('../../../../test/saucelabs.js', [], []);
goog.addDependency('../../../../test/test-utils.js', [], [], {'lang': 'es5'});
goog.addDependency('../../../../test/web-config.js', ['config'], []);

