all:
	mkdir -p build
	./Makefile.dryice.js all

clean:
	rm -f build/euclase_core.js
	@@echo ""
	@@echo ""
	@@echo "Clean!"
	@@echo ""
