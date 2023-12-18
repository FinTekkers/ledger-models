Example using protobuf-es


npm install @bufbuild/protobuf @bufbuild/protoc-gen-es @bufbuild/buf
npm install --save-dev webpack webpack-cli
npm install --save-dev ts-loader typescript
npm install --save-dev webpack-dev-server
npm install --save-dev html-webpack-plugin

npx buf generate protos
npm run build
npm run start