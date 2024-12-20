/*
 * Copyright 2023 eStorm Inc
 */

package org.keycloak.authentication.authenticators.autootp;

import org.keycloak.authentication.CredentialRegistrator;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.RequiredActionProvider;
import org.keycloak.credential.CredentialProvider;
import org.keycloak.authentication.authenticators.autootp.credential.AutoOTPModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.WebAuthnCredentialModel;
import org.keycloak.sessions.AuthenticationSessionModel;

import jakarta.ws.rs.core.Response;

import org.keycloak.models.KeycloakSession;

import java.util.Date;
import java.text.SimpleDateFormat;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * @author <a href="mailto:aaa@bbb.ccc">xXx xxXXxx</a>
 * @version $Revision: 1 $
 */
public class AutoOTPRequiredAction implements RequiredActionProvider, CredentialRegistrator {
    public static final String PROVIDER_ID = "autootp_wait";
    
    @Override
    public void evaluateTriggers(RequiredActionContext context) {

    }
    
    @Override
    public String getCredentialType(KeycloakSession session, AuthenticationSessionModel authenticationSession) {
        return WebAuthnCredentialModel.TYPE_PASSWORDLESS;
    }

    @Override
    public void requiredActionChallenge(RequiredActionContext context) {
    	UserModel user = context.getUser();
    	String username = user.getUsername();
    	
    	String hiddenUsername = "";
    	String autootpInfo = "";
    	
    	try {
    		hiddenUsername = (context.getHttpRequest().getDecodedFormParameters().getFirst("hidden_username"));
    		autootpInfo = (context.getHttpRequest().getDecodedFormParameters().getFirst("autootp_info"));
    	} catch(Exception e) {
    		System.out.println(e.toString());
    	}

        Response challenge = context.form()
        					.setAttribute("username", username)
        					.setAttribute("autootp_info", autootpInfo)
        					.createForm("autootp-wait.ftl");
        context.challenge(challenge);
    }

    @Override
    public void processAction(RequiredActionContext context) {
    	String userId = "";
    	String dbSecretKey = "";
    	String login_step = "";
    	
    	String hiddenUsername = "";
        String autootpInfo = "";
        String username = "";
        String dateTime = "";
        long gapSeconds = 0;
        
        long maxGapSeconds = 10;
        
        try {
        	userId = context.getUser().getUsername();
        	login_step = context.getRealm().getAttribute("autootpAppSettingStep");
        	dbSecretKey = context.getRealm().getAttribute("autootpServerSettingAppServerKey");
        	
	        hiddenUsername = (context.getHttpRequest().getDecodedFormParameters().getFirst("hidden_username"));
	        autootpInfo = (context.getHttpRequest().getDecodedFormParameters().getFirst("autootp_info"));
	        
	        if(autootpInfo != null && !autootpInfo.equals("")) {
	        	String tmpInfo = getDecryptAES(autootpInfo, dbSecretKey.getBytes());
        		String[] arrInfo = tmpInfo.split("\\|\\|\\|");	// dateTime + "|||" + username
        		if(arrInfo.length == 2) {
        			dateTime = arrInfo[0];
        			username = arrInfo[1];
        			
        			Date curDate = new Date();
		    		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMddHHmmss");
	    			Date reqDate = dateFormat.parse(dateTime);
		    		long reqDateTime = reqDate.getTime();
		    		long curDateTime = curDate.getTime();
		    		gapSeconds = (curDateTime - reqDateTime) / 1000;
        		}
        	}
	        
	        System.out.println("login_step [" + login_step + "] userId [" + userId + "] hiddenUsername [" + hiddenUsername + "] autootpInfo [" + autootpInfo + "] dateTime [" + dateTime + " / " + gapSeconds + "sec] username [" + username + "]");
	        
	        if(login_step.equals("1step") || login_step.equals("2step")) {
		        if(!username.equals(userId)) {
		        	System.out.println("username does not match [" + username + "] [" + userId + "] --> Login Failed !!!");
		        }
		        else if(gapSeconds > maxGapSeconds) {
		        	System.out.println(gapSeconds + " seconds have passed since AutoOTP authentication. --> Login Failed !!!");
		        }
		        else {
		        	System.out.println("userId[" + userId + "] = username[" + username + "] and (Timeout limit) " + maxGapSeconds + " > " + gapSeconds + " seconds have passed --> Login Success !!!");
		            context.success();
		        }
	        }
	        else {
	        	System.out.println("Login Success !!!");
	            context.success();
	        }
	        
        } catch(Exception e) {
        	System.out.println(e.toString());
        }
    }

    @Override
    public void close() {

    }
    
    private static String getDecryptAES(String encrypted, byte[] key) {
 		String strRet = null;
 		
 		byte[]  strIV = key;
 		if ( key == null || strIV == null ) return null;
 		try {
 			SecretKey secureKey = new SecretKeySpec(key, "AES");
 			Cipher c = Cipher.getInstance("AES/CBC/PKCS5Padding");
 			c.init(Cipher.DECRYPT_MODE, secureKey, new IvParameterSpec(strIV));
 			byte[] byteStr = java.util.Base64.getDecoder().decode(encrypted);//Base64Util.getDecData(encrypted);
 			strRet = new String(c.doFinal(byteStr), "utf-8");
 		} catch (Exception e) {
 			e.printStackTrace();
 		}
 		return strRet;	
 	}
}
