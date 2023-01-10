echo "generating rust protos"
cargo run --bin gen

echo "generating java protos"
cd ledger-models-java
gradle clean
gradle build

echo "generating python protos"
cd ../ledger-models-protos
protoc --python_out=../ledger-models-python $(find . -iname "*.proto")