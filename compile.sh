#NOTE: Compilation will fail if any of the test suites fail to run.
# This is because we don't want to publish a version of the library 
# that doesn't pass all tests.

# Create and setup virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install grpcio-tools
else
    source venv/bin/activate
fi

# Function to cleanup on exit
cleanup() {
    echo "Cleaning up..."
    deactivate
    exit 0
}

# Set up trap to catch script termination
trap cleanup EXIT

#########################################
######### RUST PROTO GENERATION #########
#########################################
echo "generating rust protos"
cd ledger-models-rust
cargo run --bin gen

#########################################
######### JAVA PROTO GENERATION #########
#########################################

echo "generating java protos"
cd ../ledger-models-java
./gradlew clean
./gradlew build

###########################################
######### JAVASCRIPT PROTO GENERATION ######
###########################################

echo "generating javascript protos"
cd ../ledger-models-protos
# generate web js. Commented out. Not planning on any web-specific code gen
#protoc \
#    --js_out=import_style=commonjs:../ledger-models-javascript/web/ \
#    --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:../ledger-models-javascript/web/ $(find . -iname "*.proto")

# generate node js
grpc_tools_node_protoc --js_out=import_style=commonjs,binary:../ledger-models-javascript/node/ --grpc_out=grpc_js:../ledger-models-javascript/node/ $(find . -ipath "**/services/**/*.proto")

grpc_tools_node_protoc --js_out=import_style=commonjs,binary:../ledger-models-javascript/node/ --grpc_out=grpc_js:../ledger-models-javascript/node/ $(find . -ipath "**/requests/**/*.proto")

grpc_tools_node_protoc --js_out=import_style=commonjs,binary:../ledger-models-javascript/node/ --grpc_out=grpc_js:../ledger-models-javascript/node/ $(find . -ipath "**/models/**/*.proto")
# generate d.ts codes
protoc \
--plugin=protoc-gen-ts=../ledger-models-javascript/node_modules/.bin/protoc-gen-ts \
--ts_out=grpc_js:../ledger-models-javascript/node/ \
-I . \
$(find . -iname "*.proto")

# compile the typescript (if any)
tsc -p tsconfig.json

###########################################
######### PYTHON PROTO GENERATION #########
###########################################

echo "generating python protos"
python -m grpc_tools.protoc -I=. --python_out=../ledger-models-python --pyi_out=../ledger-models-python --grpc_python_out=../ledger-models-python $(find . -iname "*.proto")
