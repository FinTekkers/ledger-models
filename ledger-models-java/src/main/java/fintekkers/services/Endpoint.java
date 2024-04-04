package fintekkers.services;

import java.net.URL;
import java.util.Objects;

public record Endpoint(String url, int port, boolean isHttp) {
    public Endpoint(String url, int port) {
        this(url, port, false);
    }

    @Override
    public String toString() {
        return String.format("%s:%s (http:%s)", url(), port(), isHttp());
    }
}
