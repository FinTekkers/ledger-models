use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;

pub trait RawDataModelObject {
    fn get_id(&self) -> UUIDWrapper;
    fn get_valid_from(&self) -> LocalTimestampWrapper;
    fn get_valid_to(&self) -> Option<LocalTimestampWrapper>;
    fn get_as_of(&self) -> LocalTimestampWrapper;
    fn encode(&self) -> Vec<u8>;
}

#[macro_export] macro_rules! raw_data_model_object_trait {
    ($struct_type:ty) => {
        impl RawDataModelObject for $struct_type {
            fn get_id(&self) -> UUIDWrapper {
                UUIDWrapper::new(self.proto.uuid.as_ref().unwrap().clone())
            }

            fn get_valid_from(&self) -> LocalTimestampWrapper{
                LocalTimestampWrapper::now()
            }

            fn get_valid_to(&self) -> Option<LocalTimestampWrapper> {
                Some(LocalTimestampWrapper::now())
            }

            fn get_as_of(&self) -> LocalTimestampWrapper {
                LocalTimestampWrapper::new(self.proto.as_of.as_ref().unwrap().clone())
            }

            fn encode(&self) -> Vec<u8> {
                let mut buf = Vec::new();
                let _ = &self.proto.encode(&mut buf).unwrap();
                buf
            }
        }
    }
}

//
// impl<T: Message> RawDataModelObject for T {
//     fn get_id(&self) -> UUIDWrapper {
//         UUIDWrapper::new(&self.uuid)
//     }
//
//     fn get_valid_from(&self) -> LocalTimestampWrapper {
//         todo!()
//     }
//
//     fn get_valid_to(&self) -> Option<LocalTimestampWrapper> {
//         todo!()
//     }
//
//     fn get_as_of(&self) -> LocalTimestampWrapper {
//         todo!()
//     }
// }