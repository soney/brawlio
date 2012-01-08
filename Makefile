all:
	mkdir -p game_logs
	mkdir -p build
	mkdir -p src/client/css/images
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
