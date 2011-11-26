all:
	mkdir -p build
	cp -R src/client/css/images build
	./Makefile.dryice.js all

clean:
	rm -f build/euclase_core.js
	rm -f build/home.css
	rm -rf build/images
	@@echo ""
	@@echo ""
	@@echo "Clean!"
	@@echo ""
