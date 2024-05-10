#NOTE: Compilation will fail if any of the test suites fail to run.
# This is because we don't want to publish a version of the library 
# that doesn't pass all tests.


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
gradle clean
gradle build

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
grpc_tools_node_protoc --js_out=import_style=commonjs,binary:../ledger-models-javascript/node/ --grpc_out=grpc_js:../ledger-models-javascript/node/ $(find . -iname "*.proto")

# generate d.ts codes
protoc \
--plugin=protoc-gen-ts=../ledger-models-javascript/node_modules/.bin/protoc-gen-ts \
--ts_out=grpc_js:../ledger-models-javascript/node/ \
-I . \
$(find . -iname "*.proto")

###########################################
######### PYTHON PROTO GENERATION #########
###########################################

echo "generating python protos"
#pip3 install grpcio
#pip3 install grpcio-tools
python3 -m grpc_tools.protoc -I=. --python_out=../ledger-models-python --pyi_out=../ledger-models-python --grpc_python_out=../ledger-models-python $(find . -iname "*.proto")