const kh_global=Function("return globalThis;")()||Function("return this;")()||Function("return self;")();const as_module=undefined==this;const asWorker="undefined"===typeof kh_global.window&&"undefined"===typeof kh_global.process&&kh_global.self;const cf="kh_components";const mf="kh_components_popup_esm";kh_global.kh??={};kh_global.kh.context??="undefined"!==typeof kh_global.window?kh_global.parent==kh_global?"window":"iframe":"undefined"!==typeof kh_global.process?"node.js":"undefined"!==typeof kh_global.self?kh_global.self.name??"worker":"unknown";kh_global.kh.storage??={};const cs=kh_global.kh.storage[cf]??={cf,ms:new Set};const ms=kh_global.kh.storage[mf]??={mf,cs};cs.ms.add(ms);import{isValid,isEmpty,isString,isObject,isMobile,Deferred}from"/contrib/jsm/kh_earlybird.js";import{StringMap,JSON8MergePatch}from"/contrib/jsm/kh_classes.js";import{getRandomArbitrary,defer}from"/contrib/jsm/kh_functions.js";const print_level="debug";import{Logger}from"/contrib/jsm/kh_log.js";const kh_log=new Logger(print_level,()=>name);import{DurationTime}from"/contrib/jsm/kh_duration.js";import{vjs}from"/contrib/jsm/kh_vanilla.js";import{Component,class_from_orient}from"/contrib/jsm/kh_components_base.js";const name=MF`${mf}`;const DialogStringMap=async function(){const dsm=new StringMap({"message-confirm":{de:"Bitte bestätigen Sie",en:"please confirm"},"message-success":{de:"Ausführung erfolgreich",en:"operation succeeded"},"message-info":{de:"Zu Ihrer Information",en:"for your information"},"message-warning":{de:"Bitte beachten",en:"please consider"},"message-error":{de:"Ein Fehler ist aufgetreten",en:"an error has occurred"}});StringMap.getGlobalMap().addEntries(dsm);return dsm}();const unzipString=kh_global.kh.storage.kh_js.unzipString;export class Dialog extends Component{static#defaultOpts_={position:"center",duration:-1,button_orient:"horizontal",popup_stay:false,popup_class:undefined,prevent_dialog:false,prevent_modal:false,prevent_fullscreen:false,force_buttons:false,hide_cancel_button:false,action_text:undefined,cancel_text:undefined,"notification-icon":undefined,hide_icon:false,get_back:undefined,popup_role:"popup",click_listener_delay:250};static#class_stem_="notification";static#class_popup_=`${Dialog.#class_stem_}-popup`;static#class_action_=`${Dialog.#class_stem_}-action`;static#class_cancel_=`${Dialog.#class_stem_}-cancel`;static#class_button_=`${Dialog.#class_stem_}-button`;static#class_header_=`${Dialog.#class_stem_}-header`;static#class_close_=`${Dialog.#class_stem_}-close`;static#class_title_=`${Dialog.#class_stem_}-title`;static#class_body_=`${Dialog.#class_stem_}-body`;static#class_icon_=`${Dialog.#class_stem_}-icon`;static#class_message_=`${Dialog.#class_stem_}-message`;static#class_footer_=`${Dialog.#class_stem_}-footer`;static#bodySelector_=`.${Dialog.#class_body_}`;static#titleSelector_=`.${Dialog.#class_title_}`;static#messageSelector_=`.${Dialog.#class_message_}`;static#closeSelector_=`.${Dialog.#class_close_}`;static#actionButtonSelector_=`.${Dialog.#class_action_}`;static#cancelButtonSelector_=`.${Dialog.#class_cancel_}`;static#iconSelector_=`.${Dialog.#class_icon_}`;static#dialog_types_=["confirm","success","info","warning","error"];static#dataByType_=Object.freeze(Object.fromEntries(Dialog.#dialog_types_.map(type=>[type,{classType:`${Dialog.#class_stem_}-${type}`,defaultTitle:()=>unzipString(type),defaultMessage:()=>unzipString(`message-${type}`)}])));#options_;#timeout_id_=-1;#id_=getRandomArbitrary()|0;constructor(options={}){super();if(isString(options)){try{options=JSON.parse(options)}catch(error){kh_log.warn?.(T9`${unzipString("param-invalid")} options (${options}) => ${error}`);options={}}}this.#options_=JSON8MergePatch.apply({...Dialog.#defaultOpts_},options);if(-1!=this.#options_.duration)this.#options_.duration=DurationTime.Millis(this.#options_.duration);this.#options_.click_listener_delay=DurationTime.Millis(this.#options_.click_listener_delay)}get options(){return this.#options_}get useDialog(){return Function.isFunction(HTMLDialogElement)&&true!==this.options.prevent_dialog}isOpen(elPopup){if(!isValid(elPopup)||!isValid(elPopup.parentNode))return false;return this.useDialog?true==elPopup.open:"true"==vjs.attr(elPopup,"open")}createPopup(type="confirm",position=this.#options_.position??"center"){let user_popup_class=(this.#options_.popup_class??"").split(" ").join(".");if(!isEmpty(user_popup_class))user_popup_class=`.${user_popup_class}`;const class_type=Dialog.#dataByType_[type]?.classType;if(isMobile()&&true!==this.options.prevent_fullscreen)position="full";const position_class=isString(position)?position:"position_x_y";let elPopup=vjs(`.${Dialog.#class_popup_}.${position_class}${user_popup_class}.${class_type}`,false);const hasDialog=this.useDialog;if(!isValid(elPopup)){elPopup=vjs.create(hasDialog?"dialog":"div",{class:`kh-window-popup kh-vlayout kh-justify-s-between ${Dialog.#class_popup_} ${position_class} ${class_type}`+(!isEmpty(user_popup_class)?` ${user_popup_class.substring(1).split(".").join(" ")}`:""),role:this.#options_.popup_role,data:{role:"popup"}},document.body)}else{vjs.empty(elPopup);if(this.isOpen(elPopup))vjs.off(`.${this.#id_}`)}vjs.data(elPopup,"dialog",this);elPopup.append(...this.createContainer(type));if("notification-icon"in this.options)vjs.cssvar(vjs(elPopup,Dialog.#bodySelector_),"--notification-icon",this.options["notification-icon"]);const icon=vjs.cssvar(vjs(elPopup,Dialog.#bodySelector_),"--notification-icon")?.trim("\"'");if(isEmpty(icon)||true===this.options.hide_icon)vjs.style(vjs(elPopup,Dialog.#iconSelector_),{display:"none"});vjs.style(elPopup,{left:null,right:null,top:null,bottom:null,position:null});if(isObject(position))vjs.style(elPopup,{left:`${(position.x??0)|0}px`,top:`${(position.y??0)|0}px`,position:"absolute"});return elPopup}createContainer(type){const ret=[];ret.push(vjs.div({class:`kh-hlayout kh-align-center ${Dialog.#class_header_}`,role:"header"}));ret[0].append(vjs.div({class:` kh-vlayout kh-justify-center ${Dialog.#class_title_}`,role:"title"}));ret[0].append(vjs.a({class:Dialog.#class_close_,text:"╳",role:"button"}));ret.push(vjs.div({class:`kh-hlayout ${Dialog.#class_body_}`,role:"content"}));ret[1].append(vjs.div({class:Dialog.#class_icon_,role:"icon"}));ret[1].append(vjs.div({class:Dialog.#class_message_,role:"message"}));const dialog_buttons=!isMobile()||true===this.options.prevent_fullscreen||true==this.options.force_buttons;if(type=="confirm"&&dialog_buttons){let class_button_parent_add="";let action_text="",cancel_text="";if(!isEmpty(this.#options_.cancel_text)||!isEmpty(this.#options_.action_text)){class_button_parent_add=" no-default";action_text=this.#options_.action_text||U`${"button-ok"}`;cancel_text=this.#options_.cancel_text||U`${"button-cancel"}`}ret.push(vjs.div({class:`kh-hlayout kh-justify-center ${Dialog.#class_footer_}${class_button_parent_add}`+` ${class_from_orient(this.#options_.button_orient)}`,role:"footer"}));if(true!==this.options.hide_cancel_button){ret[2].append(vjs.create("button",{class:`${Dialog.#class_button_} ${Dialog.#class_cancel_}`,text:cancel_text,role:"button"}))}ret[2].append(vjs.create("button",{class:`${Dialog.#class_button_} ${Dialog.#class_action_}`,text:action_text,role:"button"}))}return ret}setEventListener(elPopup,callback){const othis=this;const ns=`${mf}.sEL.${this.#id_}`;function listener(msg,event){event.stopPropagation();event.preventDefault();const ret=callback?.(msg)??false;vjs.off(`.${othis.#id_}`);othis.#internal_hidePopup(elPopup,msg);return ret}let pointerdowns=[];const elAction=vjs(elPopup,Dialog.#actionButtonSelector_,false);const elCancel=vjs(elPopup,Dialog.#cancelButtonSelector_,false);const elClose=vjs(elPopup,Dialog.#closeSelector_,false);if(isValid(elAction))pointerdowns.push({target:elAction,message:"ok"});if(isValid(elCancel))pointerdowns.push({target:elCancel,message:"cancel"});if(isValid(elClose))pointerdowns.push({target:elClose,message:"cancel"});if(!isEmpty(pointerdowns)){vjs.onc(`pointerdown.${ns}`,(event,btn)=>{btn??=event.target;const pd_entry=pointerdowns.find(entry=>entry.target==btn);listener(pd_entry?.message??"cancel",event)},elPopup,()=>pointerdowns.map(entry=>entry.target))}if(!isValid(elAction)&&!isValid(elCancel)&&true!==this.#options_.popup_stay&&(!isMobile()||true===this.options.prevent_fullscreen)){defer(this.#options_.click_listener_delay).then(()=>vjs.on(`click.${ns}`,listener.bind(null,"ok"),document));vjs.on(`blur.${ns}`,listener.bind(null,"ok"),window)}}#internal_hidePopup(elPopup,msg="cancel"){if(!this.isOpen(elPopup))return;if(-1!=this.#timeout_id_)clearTimeout(this.#timeout_id_);this.#timeout_id_=-1;requestIdleCallback(function(){if("DIALOG"==elPopup.tagName)elPopup.close(msg);else{elPopup.returnValue=msg;vjs.attr(elPopup,"open",null);vjs.trigger("close",elPopup)}},{timeout:500})}hidePopover(){return this.hidePopup(...arguments)}showPopover(){return this.showPopup(...arguments)}hidePopup({elPopup=this.Șdom,msg="cancel",async=false}={}){const button=("ok"===msg?vjs(elPopup,Dialog.#actionButtonSelector_):vjs(elPopup,Dialog.#cancelButtonSelector_))??vjs(elPopup,Dialog.#closeSelector_);vjs[!async?"trigger":"postEvent"]("pointerdown",button)}showPopup({type,title,message,callback,logf,async,position}={}){const elPopup=this.createPopup(type,position);Object.defineProperty(this,"Șdom",{get(){return elPopup},configurable:true});const ret=async?{promise:new Deferred,popup:this}:this;vjs.one("close",event=>ret?.promise?.resolve(elPopup.returnValue||"cancel"),elPopup);function encapsulate_(cur_func,new_func){return function(){const res_1=new_func?.(...arguments);return cur_func?.(...arguments)??res_1}}const elTitle=vjs(elPopup,Dialog.#titleSelector_,false);const elText=vjs(elPopup,Dialog.#messageSelector_,false);title||=Dialog.#dataByType_[type].defaultTitle();message||=Dialog.#dataByType_[type].defaultMessage();elTitle.insertAdjacentHTML("afterbegin",title);if(message instanceof Element){if(true==this.options.get_back){const old_parent=message.parentElement;const old_prev=message.previousElementSibling;callback=encapsulate_(callback,msg=>{if(isValid(old_prev))old_prev.insertAdjacentElement("afterend",message);else old_parent.insertAdjacentElement("afterbegin",message)})}elText.prepend(message);if("none"==vjs.style(message,"display")){vjs.style(message,"display",null);callback=encapsulate_(callback,msg=>{vjs.style(message,"display","none")})}}else elText.insertAdjacentHTML("afterbegin",message);if("DIALOG"!=elPopup.tagName&&async){callback=encapsulate_(callback,msg=>ret.promise.resolve(msg||"ok"))}if(isMobile()&&elPopup.classList.contains("full")){const ns=`${mf}.mobile.full.${this.#id_}`;defer(150).then(()=>{vjs.on(`click.${ns}`,event=>{this.hidePopup();return false},elPopup,!isEmpty(title)&&vjs.isVisible(elTitle)?Dialog.#titleSelector_:undefined)})}this.setEventListener(elPopup,callback);if(type=="confirm"||-1==this.#options_.duration){}else{this.#timeout_id_=setTimeout(()=>this.hidePopup({elPopup}),this.#options_.duration)}if("DIALOG"==elPopup.tagName){true===this.#options_.prevent_modal?elPopup.show():elPopup.showModal()}else{vjs.attr(elPopup,"open","true")}logf?.(message instanceof Element?title:message);return ret}}const stdNotification=new Dialog;const dialogMap=new Map;function getNotification(options){if(isEmpty(options))return stdNotification;let key=options.toString();try{key=JSON.stringify(options)}catch(error){kh_log.warn?.(T9`invalid options structure for dialog map`)}if(!dialogMap.has(key)){dialogMap.set(key,new Dialog(options))}return dialogMap.get(key)}export const dialog=({options={},title,message,logger=kh_log,callback,async=false,position}={})=>getNotification(options).showPopup({type:"confirm",title,message,logf:logger?.debug?.bind(logger),callback,async,position});export const info=({options={},title,message,logger=kh_log,async=false,position}={})=>getNotification(options).showPopup({type:"info",title,message,logf:logger?.info?.bind(logger),async,position});export const success=({options={},title,message,logger=kh_log,async=false,position}={})=>getNotification(options).showPopup({type:"success",title,message,logf:logger?.debug?.bind(logger),async,position});export const warning=({options={},title,message,logger=kh_log,async=false,position}={})=>getNotification(options).showPopup({type:"warning",title,message,logf:logger?.warn?.bind(logger),async,position});export const error=({options={},title,message,logger=kh_log,async=false,position}={})=>getNotification(options).showPopup({type:"error",title,message,logf:logger?.error?.bind(logger),async,position});kh_global.LoadedScripts.get(mf).resolve(ms);