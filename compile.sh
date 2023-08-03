# echo "generating rust protos"
# cd ledger-models-rust
# cargo run --bin gen

# echo "generating java protos"
# cd ../ledger-models-java
# gradle clean
# gradle build


echo "generating javascript protos"
cd ledger-models-protos
# generate web js
protoc \
    --js_out=import_style=commonjs:../ledger-models-javascript/web/ \
    --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:../ledger-models-javascript/web/ $(find . -iname "*.proto")

# generate node js
grpc_tools_node_protoc --js_out=import_style=commonjs,binary:../ledger-models-javascript/node/ --grpc_out=grpc_js:../ledger-models-javascript/node/ $(find . -iname "*.proto")

# generate d.ts codes
protoc \
--plugin=protoc-gen-ts=../ledger-models-javascript/node_modules/.bin/protoc-gen-ts \
--ts_out=grpc_js:../ledger-models-javascript/node/ \
-I . \
$(find . -iname "*.proto")



# echo "generating python protos"
# #pip3 install grpcio
# #pip3 install grpcio-tools
# python3 -m grpc_tools.protoc -I=. --python_out=../ledger-models-python --pyi_out=../ledger-models-python --grpc_python_out=../ledger-models-python $(find . -iname "*.proto")