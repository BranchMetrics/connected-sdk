
CLOSURE_COMPILER=java -jar ./node_modules/google-closure-compiler-java/compiler.jar
CLOSURE_LIBRARY= ./node_modules/google-closure-library/closure

COMPILER_ARGS=--js $(SOURCES) --externs $(EXTERN) --output_wrapper "(function() {%output%})();" --dependency_mode=PRUNE_LEGACY --entry_point branch_instance
COMPILER_MIN_ARGS=--compilation_level ADVANCED_OPTIMIZATIONS --define 'DEBUG=false'
COMPILER_DEBUG_ARGS=--formatting=print_input_delimiter --formatting=pretty_print --warning_level=VERBOSE --define 'DEBUG=true'

SOURCES=$(CLOSURE_LIBRARY)/goog/base.js\
$(CLOSURE_LIBRARY)/goog/json/json.js\
src/0_config.js\
src/0_jsonparse.js\
src/0_queue.js\
src/1_utils.js\
src/2_resources.js src/2_session.js src/2_storage.js\
src/3_api.js\
src/6_branch.js\
src/7_initialization.js

EXTERN=src/extern.js

VERSION=$(shell grep "version" package.json | perl -pe 's/\s+"version": "(.*)",/$$1/')

ONPAGE_RELEASE=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="https://cdn.branch.io/branch-connected.min.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(CLOSURE_COMPILER) | node transform.js branch_sdk))
ONPAGE_DEV=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="dist/branch-connected.min.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(CLOSURE_COMPILER) | node transform.js branch_sdk))
ONPAGE_TEST=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="../dist/branch-connected.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(CLOSURE_COMPILER) | node transform.js branch_sdk))

.PHONY: clean

all: dist/branch-connected.min.js dist/branch-connected.js example.html test/branch-deps.js test/integration-test.html
clean:
	rm -f dist/** docs/web/3_branch_web.md example.html test/branch-deps.js dist/branch-connected.min.js.gz test/integration-test.html
release: clean all dist/branch-connected.min.js.gz
	@echo "released"

test/branch-deps.js: $(SOURCES)
	npx closure-make-deps \
        --closure-path $(CLOSURE_LIBRARY)/goog \
		--f node_modules/google-closure-library/closure/goog/deps.js \
		--root src \
		--root test \
		--exclude test/web-config.js \
		--exclude test/branch-deps.js > test/branch-deps.js.tmp
	echo "// jscs:disable" | cat - test/branch-deps.js.tmp | sed -e 's#src/0_config.js#test/web-config.js#' > test/branch-deps.js && \
		rm test/branch-deps.js.tmp

dist/branch-connected.js: $(SOURCES) $(EXTERN)
	mkdir -p dist && \
	$(CLOSURE_COMPILER) $(COMPILER_ARGS) $(COMPILER_DEBUG_ARGS) > dist/branch-connected.js

dist/branch-connected.min.js: $(SOURCES) $(EXTERN)
	mkdir -p dist && \
	$(CLOSURE_COMPILER) $(COMPILER_ARGS) $(COMPILER_MIN_ARGS) > dist/branch-connected.min.js

dist/branch-connected.min.js.gz: dist/branch-connected.min.js
	mkdir -p dist && \
	gzip -c dist/branch-connected.min.js > dist/branch-connected.min.js.gz

example.html: src/web/example.template.html
ifeq ($(MAKECMDGOALS), release)
	perl -pe 'BEGIN{$$a="$(ONPAGE_RELEASE)"}; s#// INSERT INIT CODE#$$a#' src/web/example.template.html > dist/connected-example.html
else
	perl -pe 'BEGIN{$$a="$(ONPAGE_DEV)"}; s#// INSERT INIT CODE#$$a#' src/web/example.template.html > dist/connected-example.html
endif

# Documentation

docs/web/3_branch_web.md: $(SOURCES)
	perl -pe 's/\/\*\*\ =CORDOVA/\/\*\*\*/gx' src/6_branch.js > src/3_branch_web.js
	perl -p -i -e 's/=WEB//gx' src/3_branch_web.js
	jsdox src/3_branch_web.js --output docs/web
	rm src/3_branch_web.js

# integration test page

test/integration-test.html: test/integration-test.template.html
	perl -pe 'BEGIN{$$a="$(ONPAGE_TEST)"}; s#// INSERT INIT CODE#$$a#' test/integration-test.template.html > test/integration-test.html
