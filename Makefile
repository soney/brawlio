all:
	./Makefile.dryice.js
	node node_modules/requirejs/bin/r.js

clean:
	rm build/euclase_core.js
	@@echo ""
	@@echo ""
	@@echo "Clean!"
	@@echo ""
