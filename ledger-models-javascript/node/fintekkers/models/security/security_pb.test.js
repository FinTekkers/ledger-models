import jspb from 'google-protobuf';
import fintekkers_models_util_decimal_value_pb from '../util/decimal_value_pb';
import fintekkers_models_util_local_date_pb from '../util/local_date_pb';
import fintekkers_models_util_local_timestamp_pb from '../util/local_timestamp_pb';
import fintekkers_models_util_uuid_pb from '../util/uuid_pb';
import fintekkers_models_security_identifier_identifier_pb from './identifier/identifier_pb';
import fintekkers_models_security_security_type_pb from './security_type_pb';
import fintekkers_models_security_security_pb from './security_pb';
import fintekkers_models_security_security_quantity_type_pb from './security_quantity_type_pb';
import fintekkers_models_security_coupon_frequency_pb from './coupon_frequency_pb';
import fintekkers_models_security_coupon_type_pb from './coupon_type_pb';

// Import or define the SecurityProto class
import { SecurityProto } from './security_pb';

test('create a security proto (from sue) object and test it can be read', () => {
  // Usage example
  const security = new SecurityProto();

  security.setObjectClass('SomeObjectClass');
  security.setVersion('1.0');

  // ... set other properties of the security object ...

  // Serialize the object to a binary representation
  const binaryData = security.serializeBinary();

  // Deserialize the binary data back to a SecurityProto object
  const deserializedSecurity = SecurityProto.deserializeBinary(binaryData);

});
