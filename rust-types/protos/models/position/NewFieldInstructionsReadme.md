Adding new fields is a bit of a pain, but that is the point. Any new field 
will have to be supported indefinitely so we want to make sure it is well thought out.

Ideally fields are product class agnostic to maximize reuse, but there is an inherent trade-off. 
The more generic the fields, the harder they are to interpret for users who have specific expertise.

For example, if you use 'tenor' as a generic field across all products, you will likely need 
a lot of verbiage in the description so that someone can understand its meaning, whether they are 
a bond portfolio manager, or an options trader. 

1/ Create the field in the Field.java class, with a specific type and description

2/ If the type is new (e.g. a custom response) you will have to consider the build out of the serializors

3/ Add the field to the proto

4/ Validation? 