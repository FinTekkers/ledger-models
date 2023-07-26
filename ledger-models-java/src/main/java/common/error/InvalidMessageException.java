package common.error;

public class InvalidMessageException extends RuntimeException{
    public InvalidMessageException(String message) {
        super(message);
    }
}
