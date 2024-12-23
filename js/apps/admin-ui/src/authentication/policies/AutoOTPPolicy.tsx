import type RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import {
  ActionGroup,
  AlertVariant,
  Button,
  ButtonVariant,
  FormGroup,
  InputGroup,
  InputGroupText,
  PageSection,
  Select,
  SelectOption,
  SelectVariant,
  Text,
  TextContent
} from "@patternfly/react-core";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useAlerts } from "../../components/alert/Alerts";
import { FormAccess } from "../../components/form-access/FormAccess";
import { HelpItem } from "ui-shared";
import { KeycloakTextInput } from "../../components/keycloak-text-input/KeycloakTextInput";
import { useAdminClient } from "../../context/auth/AdminClient";
import { useRealm } from "../../context/realm-context/RealmContext";
import { convertFormValuesToObject, convertToFormValues } from "../../util";

import { FormPanel } from "../../components/scroll-form/FormPanel";

import { useConfirmDialog } from "../../components/confirm-dialog/ConfirmDialog";

import "./autootp-policy.css";

const AUTOOTP_AUTHENTICATION_STEP = ["1step", "2step"] as const;
const AUTOOTP_PASSWD_UPDATE = ["FALSE", "TRUE"] as const;



type AutoOTPPolicyProps = {
  realm: RealmRepresentation;
  realmUpdated: (realm: RealmRepresentation) => void;
};

type FormFields = Omit<
  RealmRepresentation,
  "clients" | "components" | "groups"
>;

export const AutoOTPPolicy = ({ realm, realmUpdated }: AutoOTPPolicyProps) => {
  const { t } = useTranslation("authentication");
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid, isDirty },
  } = useForm<FormFields>({ mode: "onChange" });
  const { adminClient } = useAdminClient();
  const { realm: realmName } = useRealm();
  const { addAlert, addError } = useAlerts();
  const [
    autootpAppSettingStepOpen,
    setAutootpAppSettingStepOpen,
  ] = useState(false);

  const [
    autootpPasswdUpdateOpen,
    setAutootpPasswdUpdateOpen,
  ] = useState(false);

  const [isBtnApplicationSettingSave, setIsBtnApplicationSettingSave] = useState<boolean>(false);

  const [isBtnserverProgressReload, setIsBtnserverProgressReload] = useState<boolean>(true);
  const [isBtnresendRegistrationEmail, setIsBtnresendRegistrationEmail] = useState<boolean>(true);
  const [isBtnresendSetupFileEmail, setIsBtnresendSetupFileEmail] = useState<boolean>(true);

  const [isTextautootpServerSettingAppServerKey, setIsTextautootpServerSettingAppServerKey] = useState<boolean>(true);
  const [isTextautootpServerSettingAuthServerDomain, setIsTextautootpServerSettingAuthServerDomain] = useState<boolean>(true);
  const [isSelectBoxPasswdUpdate, setIsSelectBoxPasswdUpdate] = useState<boolean>(true);

  const [isBtnApplicationServerSave, setIsBtnApplicationServerSave] = useState<boolean>(true);
  const [isBtnApplicationServerClear, setIsBtnApplicationServerClear] = useState<boolean>(true);


  



  const setupForm = (realm: RealmRepresentation) =>
    convertToFormValues(realm, setValue);

  useEffect(() => {
    setupForm(realm);

    const autootpReturnDomainValidationToken = getValues("attributes.autootpReturnDomainValidationToken"); 
    const autootpReturnServerProgressStatus = getValues("attributes.autootpReturnServerProgressStatus"); 
  
    if(autootpReturnDomainValidationToken != undefined && autootpReturnDomainValidationToken.length > 0) { 
      setIsBtnApplicationSettingSave(true);
      setIsBtnserverProgressReload(false);
    } else { 
      setIsBtnApplicationSettingSave(false);
      setIsBtnserverProgressReload(true);
    }  
  
    setIsBtnresendRegistrationEmail(true);
    setIsBtnresendSetupFileEmail(true);
    
    setIsTextautootpServerSettingAppServerKey(true);
    setIsTextautootpServerSettingAuthServerDomain(true);
	setIsSelectBoxPasswdUpdate(true);
	    
    setIsBtnApplicationServerSave(true);
    setIsBtnApplicationServerClear(true); 

    if(autootpReturnServerProgressStatus != undefined && autootpReturnServerProgressStatus.length > 0) {
      switch(autootpReturnServerProgressStatus){
        case "01" :
          setIsBtnresendRegistrationEmail(false);
          setIsBtnresendSetupFileEmail(true);
          break;
        
        case "02" :
          setIsBtnresendRegistrationEmail(true);
          setIsBtnresendSetupFileEmail(true);
          break;
  
        case "10" :
          setIsBtnserverProgressReload(true);
          setIsBtnresendRegistrationEmail(true);
          setIsBtnresendSetupFileEmail(false);
          setIsTextautootpServerSettingAppServerKey(false);
          setIsTextautootpServerSettingAuthServerDomain(false);
          setIsSelectBoxPasswdUpdate(false);
          setIsBtnApplicationServerSave(false);
          setIsBtnApplicationServerClear(false); 
          break;
        default :
          setIsBtnresendRegistrationEmail(true);
          setIsBtnresendSetupFileEmail(true);
          break;
                
      } 
  
    } else {
      setIsBtnresendRegistrationEmail(true);
      setIsBtnresendSetupFileEmail(true);
      
    }
  


  }, []);



  const onDeleteSubmit = async (formValues: FormFields) => {
    try {

      formValues.attributes = undefined;

      await adminClient.realms.update(
        { realm: realmName },
        convertFormValuesToObject(formValues)
        );
        
        const updatedRealm = await adminClient.realms.findOne({
          realm: realmName,
          
        });
      realmUpdated(updatedRealm!);
      setupForm(updatedRealm!);
      addAlert(t("updateAutoOTPSuccess"), AlertVariant.success);
      window.location.reload();
      
    } catch (error) {
      addError("authentication:updateAutoOTPError", error);
    } finally {

    }
  };





  const onDelete = async (formValues: FormFields) => {
    
    try {

      let paramStr = "/auth/realms/master/protocol/openid-connect/autootp-policy-api"; 
      let returnCode = "";

      paramStr = paramStr + "?urlKey=kcAutootpDeleteKey";
      paramStr = paramStr + "&appID="+getValues("attributes.autootpAppSettingappID");
      let delkey = "";

      fetch(paramStr, {
          method : "GET"   
      }).then(res=>res.json()).then(res=>{
        let error = "";
        if(res.result != ''){
            let objKey = JSON.parse(res.result);
            let code = objKey.code;
            returnCode = "" + code;
            switch(objKey.code){
              case undefined :
                error = "Server progress Delete error~! ["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "000.0" :
                  delkey = objKey.data.delkey;

                  let paramStr = "/auth/realms/master/protocol/openid-connect/autootp-policy-api"; 
                  let returnCode = "";
                  
                  paramStr = paramStr + "?urlKey=kcAutootpDelete";
                  paramStr = paramStr + "&delkey="+delkey;
									paramStr = paramStr + "&appID="+getValues("attributes.autootpAppSettingappID");
                  
                  fetch(paramStr, {
                      method : "GET"   
                  }).then(res=>res.json()).then(res=>{
                      if(res.result != ''){
                        let objDel = JSON.parse(res.result);
                        let code = objDel.code;
                        returnCode = "" + code;
                        switch(objDel.code){
                          case undefined :
                            error = t("autootpApiResponseCodeUndefined")+"["+code+"]";
                            addError("authentication:updateAutoOTPError",error);
                            break;
                          case "000.0" :
                            onDeleteSubmit({...realm});                          
                            break;
                  
                          case "000.1" :
                            error = t("autootpApiResponseCode000.1")+"["+code+"]";
                            addError("authentication:updateAutoOTPError",error);
                            break;
                          case "000.2" :
                            error = t("autootpApiResponseCode000.2")+"["+code+"]";
                            addError("authentication:updateAutoOTPError",error);
                            break;
                          case "100.1" :
                            error = t("autootpApiResponseCode100.1")+"["+code+"]";
                            addError("authentication:updateAutoOTPError",error);
                            break;
                          case "100.2" :
                            error = t("autootpApiResponseCode100.2")+"["+code+"]";
                            addError("authentication:updateAutoOTPError",error);
                            break;
                          case "100.3" :
                            error = t("autootpApiResponseCode100.3")+"["+code+"]";
                            addError("authentication:updateAutoOTPError",error);
                            break;
                          case "100.4" :
                            error = t("autootpApiResponseCode100.4")+"["+code+"]";
                            addError("authentication:updateAutoOTPError",error);
                            break;
                          case "100.5" :
                            error = t("autootpApiResponseCode100.5")+"["+code+"]";
                            addError("authentication:updateAutoOTPError",error);
                            break;
                          case "100.6" :
                            error = t("autootpApiResponseCode100.6")+"["+code+"]";
                            alert(error);
                            onDeleteSubmit({...realm});
                            break;
                          default : 
                            error = t("autootpApiResponseCodeDefault")+"["+code+"]";
                            addError("authentication:updateAutoOTPError",error);
                            break;
                        }

                      } else {
                        error = t("autootpApiConnectError");
                        addError("authentication:updateAutoOTPError",error);
                      }                    
                    })
                break;

              case "000.1" :
                error = t("autootpApiResponseCode000.1")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "000.2" :
                error = t("autootpApiResponseCode000.2")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.1" :
                error = t("autootpApiResponseCode100.1")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.2" :
                error = t("autootpApiResponseCode100.2")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.3" :
                error = t("autootpApiResponseCode100.3")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.4" :
                error = t("autootpApiResponseCode100.4")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.5" :
                error = t("autootpApiResponseCode100.5")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.6" :
                error = t("autootpApiResponseCode100.6")+"["+code+"]";
                alert(error);
                onDeleteSubmit({...realm});
                break;
              default : 
                error = t("autootpApiResponseCodeDefault")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
            }

          } else {
            error = t("autootpApiConnectError");
            addError("authentication:updateAutoOTPError",error);
          }                    

      })
    
    } catch (error) {
      addError("authentication:updateAutoOTPError", error);
    }
  };
 

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: t("autootpDeleteConfirmTitle"),
    messageKey: t("autootpDeleteConfirmDialog"),
    continueButtonLabel: "delete",
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      try {
        onDelete({...realm});
      } catch (error) {
        addError("authentication:updateAutoOTPError", error);
      }
    },
  });


  const onSubmit = async (formValues: FormFields) => {
	
    try {

	     await adminClient.realms.update(
	        { realm: realmName },
	        convertFormValuesToObject(formValues)
	      );
	
	      const updatedRealm = await adminClient.realms.findOne({
	        realm: realmName,
	      });
	
	      realmUpdated(updatedRealm!);
	      setupForm(updatedRealm!);
	      addAlert(t("updateAutoOTPSuccess"), AlertVariant.success);
    } catch (error) {
      addError("authentication:updateAutoOTPError", error);
    }
  };

  const onApplicationStepSave = async () => {
    handleSubmit(onSubmit)();
    setIsBtnApplicationSettingSave(true);
  }

  const onApplicationSettingSave = async () => {
    try {
      let paramStr = "/auth/realms/master/protocol/openid-connect/autootp-policy-api"; 
      let returnCode = "";
  
      paramStr = paramStr + "?urlKey=kcAutootpAppSave";
      paramStr = paramStr + "&appName="+getValues("attributes.autootpAppSettingName");
      paramStr = paramStr + "&appDomain="+getValues("attributes.autootpAppSettingDomain");
      paramStr = paramStr + "&appIp="+getValues("attributes.autootpAppSettingIpAddress");
      paramStr = paramStr + "&authDomain="+getValues("attributes.autootpAppSettingProxyServerDomain");
      paramStr = paramStr + "&mail="+getValues("attributes.autootpAppSettingEmail");

      fetch(paramStr, {
          method : "GET"   
      }).then(res=>res.json()).then(res=>{
          let error = "";

          if(res.result != ''){
            let objSave = JSON.parse(res.result);
            let code = objSave.code;

            returnCode = "" + code;

            switch(objSave.code){
              case undefined :
                error = t("autootpApiResponseCodeUndefined")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "000.0" :
                setIsBtnApplicationSettingSave(true);
    
                setIsBtnserverProgressReload(false);
                setIsBtnresendRegistrationEmail(true);
                setIsBtnresendSetupFileEmail(true);
          
                setIsTextautootpServerSettingAppServerKey(true);
                setIsTextautootpServerSettingAuthServerDomain(true);
                setIsSelectBoxPasswdUpdate(true);
          
                setIsBtnApplicationServerSave(true);
                setIsBtnApplicationServerClear(true);

                if(objSave.data.appID == undefined) {
                  error = t("autootpApiResponseCodeAppIDError")+"["+code+"]";
                  addError("authentication:updateAutoOTPError",error);
                  return;
                } else {
                  setValue("attributes.autootpAppSettingappID",objSave.data.appID);
                }
                
                if(objSave.data.dnsTxt == undefined) {
                  error = t("autootpApiResponseCodednsTxtError")+"["+code+"]";
                  addError("authentication:updateAutoOTPError",error);
                  return;
                } else {
                  setValue("attributes.autootpReturnDomainValidationToken",objSave.data.dnsTxt);
                }
                              
                setValue("attributes.autootpReturnServerProgress",t("autootpReturnServerProgressSave"));

                handleSubmit(onSubmit)();

                break;
  
              case "000.1" :
                error = t("autootpApiResponseCode000.1")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "000.2" :
                error = t("autootpApiResponseCode000.2")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.1" :
                error = t("autootpApiResponseCode100.1")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.2" :
                error = t("autootpApiResponseCode100.2")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.3" :
                error = t("autootpApiResponseCode100.3")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.4" :
                error = t("autootpApiResponseCode100.4")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.5" :
                error = t("autootpApiResponseCode100.5")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.6" :
                error = t("autootpApiResponseCode100.6")+"["+code+"]";
                alert(error);
                onDeleteSubmit({...realm});
                break;
              default : 
                error = t("autootpApiResponseCodeDefault")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              }
        
            } else {
              error = t("autootpApiConnectError");
              addError("authentication:updateAutoOTPError",error);
            }                    

        });  
    
    } catch (error) {
      addError("authentication:updateAutoOTPError", error);
    }
  };


  const onServerProgressReload = async (formValues: FormFields) => {
    try {
      
      let paramStr = "/auth/realms/master/protocol/openid-connect/autootp-policy-api"; 
      let returnCode = "";

      paramStr = paramStr + "?urlKey=kcDevcenterReload";
      paramStr = paramStr + "&appID="+getValues("attributes.autootpAppSettingappID");
      
      fetch(paramStr, {
          method : "GET"   
      }).then(res=>res.json()).then(res=>{
          let error = "";

          if(res.result != ''){
            let objReload = JSON.parse(res.result);
            var code = objReload.code;
            returnCode = "" + code;

            switch(objReload.code){
              case undefined :
                error = t("autootpApiResponseCodeUndefined")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                setValue("attributes.autootpReturnServerProgress",error);
                break;
              case "000.0" :
                if(objReload.data.status == undefined || objReload.data.status.length <= 0) {
                  error = t("autootpApiResponseCodeUndefined")+"["+objReload.data.status+"]";
                  addError("authentication:updateAutoOTPError",error);
                  setValue("attributes.autootpReturnServerProgress",error);
                  break;
                } else {
                  switch(objReload.data.status){
                    case "01" :
                      setValue("attributes.autootpReturnServerProgress",t("autootpReturnServerProgress01"));
                      setValue("attributes.autootpReturnServerProgressStatus", objReload.data.status);
                      setIsBtnresendRegistrationEmail(false);
                      setIsBtnresendSetupFileEmail(true);
                      break;
                    case "02" :
                      setValue("attributes.autootpReturnServerProgress",t("autootpReturnServerProgress02"));
                      setValue("attributes.autootpReturnServerProgressStatus", objReload.data.status);
                      setIsBtnresendRegistrationEmail(true);
                      setIsBtnresendSetupFileEmail(true);
                      break;
                    case "10" :
                      setValue("attributes.autootpReturnServerProgress",t("autootpReturnServerProgress10"));
                      setValue("attributes.autootpReturnServerProgressStatus", objReload.data.status);
                      setIsBtnserverProgressReload(true);
                      setIsBtnresendRegistrationEmail(true);
                      setIsBtnresendSetupFileEmail(false);
                      
                      setIsTextautootpServerSettingAppServerKey(false);
                      setIsTextautootpServerSettingAuthServerDomain(false);
                      setIsSelectBoxPasswdUpdate(false);
                
                      setIsBtnApplicationServerSave(false);
                      setIsBtnApplicationServerClear(false);
                      break;
                    case "11" :
                      setValue("attributes.autootpReturnServerProgress",t("autootpReturnServerProgress11"));
                      break;
                    default :
                      setValue("attributes.autootpReturnServerProgress","Exception status ["+objReload.data.status+"]");
                      break;
                  }
                  addAlert(t("autootpServerProgressReloadSuccess"), AlertVariant.success);
                }
                handleSubmit(onSubmit)();
                break;

              case "000.1" :
                error = t("autootpApiResponseCode000.1")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "000.2" :
                error = t("autootpApiResponseCode000.2")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.1" :
                error = t("autootpApiResponseCode100.1")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.2" :
                error = t("autootpApiResponseCode100.2")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.3" :
                error = t("autootpApiResponseCode100.3")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.4" :
                error = t("autootpApiResponseCode100.4")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.5" :
                error = t("autootpApiResponseCode100.5")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;
              case "100.6" :
                error = t("autootpApiResponseCode100.6")+"["+code+"]";
                alert(error);
                onDeleteSubmit({...realm});
                break;
              default : 
              error = t("autootpApiResponseCodeDefault")+"["+code+"]";
                addError("authentication:updateAutoOTPError",error);
                break;

            }

          } else {
            error = t("autootpApiConnectError");
            addError("authentication:updateAutoOTPError",error);
          }                    

      });              
      
    } catch (error) {
      addError("authentication:updateAutoOTPError", error);
    }
  };

  const onResendRegistrationEmail = async (formValues: FormFields) => {
    try {
    let paramStr = "/auth/realms/master/protocol/openid-connect/autootp-policy-api"; 
    let returnCode = "";

    paramStr = paramStr + "?urlKey=kcDevcenterRemail";
    paramStr = paramStr + "&appID="+getValues("attributes.autootpAppSettingappID");
    
    fetch(paramStr, {
        method : "GET"   
    }).then(res=>res.json()).then(res=>{
        let error = "";

        if(res.result != ''){
        
          let objReload = JSON.parse(res.result);
          let code = objReload.code;
          returnCode = "" + code;
          switch(objReload.code){
            case undefined :
              error = t("autootpApiResponseCodeUndefined")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "000.0" :
              addAlert(t("autootpServerEmailResendSuccess"), AlertVariant.success);
              break;

            case "000.1" :
              error = t("autootpApiResponseCode000.1")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "000.2" :
              error = t("autootpApiResponseCode000.2")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.1" :
              error = t("autootpApiResponseCode100.1")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.2" :
              error = t("autootpApiResponseCode100.2")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.3" :
              error = t("autootpApiResponseCode100.3")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.4" :
              error = t("autootpApiResponseCode100.4")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.5" :
              error = t("autootpApiResponseCode100.5")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.6" :
              error = t("autootpApiResponseCode100.6")+"["+code+"]";
              alert(error);
              onDeleteSubmit({...realm});
              break;
            default : 
              error = t("autootpApiResponseCodeDefault")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            }
          } else {
            error = t("autootpApiConnectError");
            addError("authentication:updateAutoOTPError",error);
          }                    
      });  
    
    } catch (error) {
      addError("authentication:updateAutoOTPError", error);
    }
  };

  const onResendSettingsEmail = async (formValues: FormFields) => {
    try {
    let paramStr = "/auth/realms/master/protocol/openid-connect/autootp-policy-api"; 
    let returnCode = "";

    paramStr = paramStr + "?urlKey=kcDevcenterRemailSetting";
    paramStr = paramStr + "&appID="+getValues("attributes.autootpAppSettingappID");
    
    fetch(paramStr, {
        method : "GET"   
    }).then(res=>res.json()).then(res=>{
        let error = "";

        if(res.result != ''){
        
          let objReload = JSON.parse(res.result);
          let code = objReload.code;
          returnCode = "" + code;
          switch(objReload.code){
            case undefined :
              error = t("autootpApiResponseCodeUndefined")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "000.0" :
              addAlert(t("autootpResendSettingsEmailSuccess"), AlertVariant.success);
              break;

            case "000.1" :
              error = t("autootpApiResponseCode000.1")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "000.2" :
              error = t("autootpApiResponseCode000.2")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.1" :
              error = t("autootpApiResponseCode100.1")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.2" :
              error = t("autootpApiResponseCode100.2")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.3" :
              error = t("autootpApiResponseCode100.3")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.4" :
              error = t("autootpApiResponseCode100.4")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.5" :
              error = t("autootpApiResponseCode100.5")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            case "100.6" :
              error = t("autootpApiResponseCode100.6")+"["+code+"]";
              alert(error);
              onDeleteSubmit({...realm});
              break;
            default : 
              error = t("autootpApiResponseCodeDefault")+"["+code+"]";
              addError("authentication:updateAutoOTPError",error);
              break;
            }
          } else {
            error = t("autootpApiConnectError");
            addError("authentication:updateAutoOTPError",error);
          }                    
      });  
    } catch (error) {
      addError("authentication:updateAutoOTPError", error);
    }
  };


  return (
    <PageSection variant="light">

      <DeleteConfirm />

      <div className="pf-u-p-0">
        <FormPanel title={t("autootpAppSettingTitle")} className="kc-linked-idps">
        </FormPanel>
        <br/>
      </div>

      <FormAccess
        role="manage-realm"
        isHorizontal
        onSubmit={handleSubmit(onSubmit)}
      >


        <FormGroup
          fieldId="autootpAppSettingStep"
          label={t("autootpAppSettingStep")}
          labelIcon={
            <HelpItem
              helpText={t(
                "authentication-help:autootpAppSettingStep"
              )}
              fieldLabelId="authentication:autootpAppSettingStep"
            />
          }
        >
          <Controller
            name="attributes.autootpAppSettingStep"
            defaultValue={AUTOOTP_AUTHENTICATION_STEP[0]}
            control={control}
            render={({ field }) => (
              <Select
                toggleId="autootpAppSettingStep"
                onSelect={(_, value) => {
                  setAutootpAppSettingStepOpen(false);
                  field.onChange(value.toString());
                  if(isBtnApplicationSettingSave){
                    onApplicationStepSave();
                    setIsBtnApplicationSettingSave(true);
                  }
                  if(field.value == '1step'){
					setIsSelectBoxPasswdUpdate(true);
				  } else {
					setIsSelectBoxPasswdUpdate(false);
				  }
                }}
                selections={field.value}
                variant={SelectVariant.single}
                isOpen={autootpAppSettingStepOpen}
                onToggle={(isExpanded) =>
                  setAutootpAppSettingStepOpen(isExpanded)
                }
                
              >
                {AUTOOTP_AUTHENTICATION_STEP.map((value) => (
                  <SelectOption
                    key={value}
                    value={value}
                    selected={value === field.value}
                  >
                    {t(`autootpAppSettingSteps.${value}`)}
                  </SelectOption>
                ))}
              </Select>
            )}
          />
        </FormGroup>


        <FormGroup
            label={t("autootpAppSettingName")}
            labelIcon={
              <HelpItem
                helpText={t("authentication-help:autootpAppSettingName")}
                fieldLabelId="authentication:autootpAppSettingName"
              />
            }
            fieldId="autootpAppSettingName"
          >
            <KeycloakTextInput
              id="autootpAppSettingName"
              data-testid="autootpAppSettingName"
              isReadOnly={isBtnApplicationSettingSave}
              placeholder="ex) Sample Name"
              {...register("attributes.autootpAppSettingName", {
                  required: {
                            value: true,
                            message: t("common:required"),
                          },
        			})}
            />
          </FormGroup>


        <FormGroup
            label={t("autootpAppSettingDomain")}
            labelIcon={
              <HelpItem
                helpText={t("authentication-help:autootpAppSettingDomain")}
                fieldLabelId="authentication:autootpAppSettingDomain"
              />
            }
            fieldId="autootpAppSettingDomain"
          >
            <KeycloakTextInput
              id="autootpAppSettingDomain"
              data-testid="autootpAppSettingDomain"
              isReadOnly={isBtnApplicationSettingSave}
              placeholder="ex) www.samplesite.com"
              {...register("attributes.autootpAppSettingDomain", {
                  required: {
                            value: true,
                            message: t("common:required"),
                          },
                })}
            />
          </FormGroup>


        <FormGroup
            label={t("autootpAppSettingIpAddress")}
            labelIcon={
              <HelpItem
                helpText={t("authentication-help:autootpAppSettingIpAddress")}
                fieldLabelId="authentication:autootpAppSettingIpAddress"
              />
            }
            fieldId="autootpAppSettingIpAddress"
          >
            <KeycloakTextInput
              id="autootpAppSettingIpAddress"
              data-testid="autootpAppSettingIpAddress"
              isReadOnly={isBtnApplicationSettingSave}
              placeholder="ex) 123.12.34.123"
              {...register("attributes.autootpAppSettingIpAddress", {
                  required: {
                            value: true,
                            message: t("common:required"),
                          },
                })}
            />
          </FormGroup>


        <FormGroup
            label={t("autootpAppSettingProxyServerDomain")}
            labelIcon={
              <HelpItem
                helpText={t("authentication-help:autootpAppSettingProxyServerDomain")}
                fieldLabelId="authentication:autootpAppSettingProxyServerDomain"
              />
            }
            fieldId="autootpAppSettingProxyServerDomain"
          >
            <KeycloakTextInput
              id="autootpAppSettingProxyServerDomain"
              data-testid="autootpAppSettingProxyServerDomain"
              isReadOnly={isBtnApplicationSettingSave}
              placeholder="ex) proxy.samplesite.com"
              {...register("attributes.autootpAppSettingProxyServerDomain", {
                  required: {
                            value: true,
                            message: t("common:required"),
                          },
                })}
            />
          </FormGroup>



        <FormGroup
            label={t("autootpAppSettingEmail")}
            labelIcon={
              <HelpItem
                helpText={t("authentication-help:autootpAppSettingEmail")}
                fieldLabelId="authentication:autootpAppSettingEmail"
              />
            }
            fieldId="autootpAppSettingEmail"
          >
            <KeycloakTextInput
              id="autootpAppSettingEmail"
              data-testid="autootpAppSettingEmail"
              isReadOnly={isBtnApplicationSettingSave}
              type="email"
              placeholder="ex) email@samplesite.com"
              {...register("attributes.autootpAppSettingEmail", {
                  required: {
                            value: true,
                            message: t("common:required"),
                          },
                })}
            />
          </FormGroup>


        <ActionGroup>
          <Button
            data-testid="save"
            variant="primary"
            isDisabled={ !isValid || !isDirty || isBtnApplicationSettingSave} 
            
            onClick={() => {
              onApplicationSettingSave();
            }}
          >
            {t("common:save")}
          </Button>
          <Button
            data-testid="delete"
            variant="danger"
            isDisabled={ !isBtnApplicationSettingSave } 
            onClick={() => {
              //onDelete({...realm});
              toggleDeleteDialog();
            }}
          >
            {t("common:delete")}
          </Button>
        </ActionGroup>


      <div className="pf-u-p-0">
        <FormPanel title={t("autootpReturnServerProgressTitle")} className="kc-linked-idps">
        </FormPanel>
      </div>
     

        <FormGroup
            label={t("autootpReturnDomainValidationToken")}
            labelIcon={
              <HelpItem
                helpText={t("authentication-help:autootpReturnDomainValidationToken")}
                fieldLabelId="authentication:autootpReturnDomainValidationToken"
              />
            }
            fieldId="autootpReturnDomainValidationToken"
          >
            <KeycloakTextInput
              id="autootpReturnDomainValidationToken"
              isReadOnly
              data-testid="autootpReturnDomainValidationToken"
              {...register("attributes.autootpReturnDomainValidationToken", {
			          })}
            />
          </FormGroup>


        <FormGroup
            label={t("autootpReturnServerProgress")}
            labelIcon={
              <HelpItem
                helpText={t("authentication-help:autootpReturnServerProgress")}
                fieldLabelId="authentication:autootpReturnServerProgress"
              />
            }
            fieldId="autootpReturnServerProgress"
          >
            <KeycloakTextInput
              id="autootpReturnServerProgress"
              isReadOnly
              data-testid="autootpReturnServerProgress"
              {...register("attributes.autootpReturnServerProgress", {
			          })}
            />
          </FormGroup>


          <input type="hidden" id="autootpAppSettingappID" data-testid="autootpAppSettingappID" {...register("attributes.autootpAppSettingappID")} />
          <input type="hidden" id="autootpReturnServerProgressStatus" data-testid="autootpReturnServerProgressStatus" {...register("attributes.autootpReturnServerProgressStatus")} />

        <ActionGroup>
          <Button
            data-testid="serverprogressreload"
            type="button"
            variant="secondary"
            isDisabled={isBtnserverProgressReload}
            onClick={() => onServerProgressReload({ ...realm })}
          >
            {t("autootpServerProgressReload")}
          </Button>
          <Button
            data-testid="resendregistrationemail"
            type="button"
            variant="secondary"
            isDisabled={isBtnresendRegistrationEmail}
            onClick={() => onResendRegistrationEmail({ ...realm })}
          >
            {t("autootpResendRegistrationEmail")}
          </Button>
          <Button
            data-testid="resendsettingsemail"
            type="button"
            variant="secondary"
            isDisabled={isBtnresendSetupFileEmail}
            onClick={() => onResendSettingsEmail({ ...realm })}
          >
            {t("autootpResendSettingEmail")}
          </Button>
        </ActionGroup>
  
      <div className="pf-u-p-0">
      <FormPanel title={t("autootpServerSettingTitle")} className="kc-linked-idps">
      </FormPanel>
      <p></p>
      </div>
      

        <FormGroup
            label={t("autootpServerSettingAppServerKey")}
            labelIcon={
              <HelpItem
                helpText={t("authentication-help:autootpServerSettingAppServerKey")}
                fieldLabelId="authentication:autootpServerSettingAppServerKey"
              />
            }
            fieldId="autootpServerSettingAppServerKey"
          >
            <KeycloakTextInput
              id="autootpServerSettingAppServerKey"
              data-testid="autootpServerSettingAppServerKey"
              isDisabled={isTextautootpServerSettingAppServerKey}
              {...register("attributes.autootpServerSettingAppServerKey", {
          			})}
            />
          </FormGroup>


 

        <FormGroup
            label={t("autootpServerSettingAuthServerDomain")}
            labelIcon={
              <HelpItem
                helpText={t("authentication-help:autootpServerSettingAuthServerDomain")}
                fieldLabelId="authentication:autootpServerSettingAuthServerDomain"
              />
            }
            fieldId="autootpServerSettingAuthServerDomain"
          >
            <KeycloakTextInput
              id="autootpServerSettingAuthServerDomain"
              data-testid="autootpServerSettingAuthServerDomain"
              isDisabled={isTextautootpServerSettingAuthServerDomain}
              {...register("attributes.autootpServerSettingAuthServerDomain", {
			          })}
            />
          </FormGroup>



	       <FormGroup
	          fieldId="autootpPasswdUpdate"
	          label={t("autootpPasswdUpdate")}
	          labelIcon={
	            <HelpItem
	              helpText={t(
	                "authentication-help:autootpPasswdUpdate"
	              )}
	              fieldLabelId="authentication:autootpPasswdUpdate"
	            />
	          }
	        >
	          <Controller
	            name="attributes.autootpPasswdUpdate"
	            defaultValue={AUTOOTP_PASSWD_UPDATE[0]}
	            control={control}
	            render={({ field }) => (
	              <Select
	                toggleId="autootpPasswdUpdate"
	                onSelect={(_, value) => {
	                  setAutootpPasswdUpdateOpen(false);
	                  field.onChange(value.toString());
	                }}
	                selections={field.value}
	                variant={SelectVariant.single}
	                isOpen={autootpPasswdUpdateOpen}
	                isDisabled={isSelectBoxPasswdUpdate}
	                onToggle={(isExpanded) =>
	                  setAutootpPasswdUpdateOpen(isExpanded)
	                }
	                
	              >
	                {AUTOOTP_PASSWD_UPDATE.map((value) => (
	                  <SelectOption
	                    key={value}
	                    value={value}
	                    selected={value === field.value}
	                  >
	                    {t(`autootpPasswdUpdates.${value}`)}
	                  </SelectOption>
	                ))}
	              </Select>
	            )}
	          />
	        </FormGroup>



        <ActionGroup>
          <Button
            data-testid="save"
            variant="primary"
            type="submit"
            isDisabled={isBtnApplicationServerSave}
          >
            {t("common:save")}
          </Button>

          <Button
            data-testid="clear"
            type="button"
            variant="secondary"
            isDisabled={isBtnApplicationServerClear}
            onClick={() => setupForm({ ...realm })}
          >
            {t("common:clear")}
          </Button>


        </ActionGroup>
      </FormAccess>
    </PageSection>
  );
};
