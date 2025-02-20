<#import "template.ftl" as layout>
<@layout.emailLayout>
[ AutoOTP Register/Unregister ]
<br>
Click <a href='${autootpLink}?movehome=T&oneclick=T&link=${link}&param=${autootpRegParam}' target='_blank'>this link</a> to set AutoOTP
<br>This link will expire within ${strExpiration}.
<br>If you didn't request to send this email, just ignore this message.
</@layout.emailLayout>
