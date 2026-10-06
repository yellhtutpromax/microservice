export const responseSuccess = (status=200,message='Response success',data=null) =>
{
    return {status: status,message: message,data: data,}
}
export const responseError = (status=500,message='Response Error !',data=null) =>
{
    return {status: status,message: message,data: data,}
}

