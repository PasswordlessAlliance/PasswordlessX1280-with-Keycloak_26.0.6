/*
 * Copyright 2016 Red Hat, Inc. and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.keycloak.services;

import jakarta.ws.rs.core.HttpHeaders;
import org.keycloak.common.ClientConnection;
import org.keycloak.http.HttpRequest;
import org.keycloak.http.HttpResponse;
import org.keycloak.locale.LocaleSelectorProvider;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakUriInfo;
import org.keycloak.models.OrganizationModel;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.keycloak.theme.Theme;
import org.keycloak.urls.UrlType;

import java.net.URI;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * @author <a href="mailto:sthorger@redhat.com">Stian Thorgersen</a>
 */
public abstract class DefaultKeycloakContext implements KeycloakContext {

    private RealmModel realm;

    private ClientModel client;

    private OrganizationModel organization;

    protected KeycloakSession session;

    private Map<UrlType, KeycloakUriInfo> uriInfo;

    private AuthenticationSessionModel authenticationSession;
    private UserSessionModel userSession;
    private HttpRequest request;
    private HttpResponse response;
    private ClientConnection clientConnection;

    public DefaultKeycloakContext(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public URI getAuthServerUrl() {
        return getUri(UrlType.FRONTEND).getBaseUri();
    }

    @Override
    public String getContextPath() {
        return getUri(UrlType.FRONTEND).getBaseUri().getPath();
    }

    @Override
    public KeycloakUriInfo getUri(UrlType type) {
        if (uriInfo == null || !uriInfo.containsKey(type)) {
            if (uriInfo == null) {
                uriInfo = new HashMap<>();
            }

            uriInfo.put(type, new KeycloakUriInfo(session, type, getHttpRequest().getUri()));
        }
        return uriInfo.get(type);
    }

    @Override
    public KeycloakUriInfo getUri() {
        return getUri(UrlType.FRONTEND);
    }

    /**
     * @deprecated
     * Use {@link #getHttpRequest()} to obtain the request headers.
     * @return
     */
    @Deprecated
    @Override
    public HttpHeaders getRequestHeaders() {
        return getHttpRequest().getHttpHeaders();
    }

    @Override
    public RealmModel getRealm() {
        return realm;
    }

    @Override
    public void setRealm(RealmModel realm) {
        this.realm = realm;
        this.uriInfo = null;
    }

    @Override
    public ClientModel getClient() {
        if (client == null) {
            client = Optional.ofNullable(authenticationSession)
                    .map(AuthenticationSessionModel::getClient)
                    .orElse(null);
        }
        return client;
    }

    @Override
    public void setClient(ClientModel client) {
        this.client = client;
    }

    @Override
    public OrganizationModel getOrganization() {
        return organization;
    }

    @Override
    public void setOrganization(OrganizationModel organization) {
        this.organization = organization;
    }

    @Override
    public ClientConnection getConnection() {
        if (clientConnection == null) {
            clientConnection = createClientConnection();
        }

        return clientConnection;
    }

    @Override
    public Locale resolveLocale(UserModel user) {
        return session.getProvider(LocaleSelectorProvider.class).resolveLocale(getRealm(), user);
    }

    @Override
    public Locale resolveLocale(UserModel user, Theme.Type themeType) {
        return session.getProvider(LocaleSelectorProvider.class).resolveLocale(getRealm(), user, themeType);
    }

    @Override
    public AuthenticationSessionModel getAuthenticationSession() {
        return authenticationSession;
    }

    @Override
    public void setAuthenticationSession(AuthenticationSessionModel authenticationSession) {
        this.authenticationSession = authenticationSession;
    }

    @Override
    public HttpRequest getHttpRequest() {
        if (request == null) {
            request = createHttpRequest();
        }

        return request;
    }

    @Override
    public HttpResponse getHttpResponse() {
        if (response == null) {
            response = createHttpResponse();
        }

        return response;
    }

    protected ClientConnection createClientConnection() {
        return null;
    }

    protected abstract HttpRequest createHttpRequest();

    protected abstract HttpResponse createHttpResponse();

    protected KeycloakSession getSession() {
        return session;
    }

    @Override
    public void setConnection(ClientConnection clientConnection) {
        this.clientConnection = clientConnection;
    }

    @Override
    public void setHttpRequest(HttpRequest httpRequest) {
        this.request = httpRequest;
    }

    @Override
    public void setHttpResponse(HttpResponse httpResponse) {
        this.response = httpResponse;
    }

    @Override
    public UserSessionModel getUserSession() {
        return userSession;
    }

    @Override
    public void setUserSession(UserSessionModel userSession) {
        this.userSession = userSession;
    }
}
