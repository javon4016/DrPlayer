from fastapi import FastAPI, Request, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

# 设置跨域支持
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有域名访问，生产环境中可以指定具体域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
)


@app.api_route('/proxy/{full_url:path}', methods=['GET', 'POST', 'PUT', 'DELETE'])
async def proxy(request: Request, full_url: str):
    target_url = full_url if full_url.startswith("http") else f"http://{full_url}"
    timeout = httpx.Timeout(60.0, read=120.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            # 处理 GET 请求
            if request.method == "GET":
                response = await client.get(target_url, headers=request.headers, params=request.query_params,
                                            stream=True)

            # 处理 POST 请求
            elif request.method == "POST":
                content_type = request.headers.get('content-type', '')  # 默认空字符串

                # 处理 JSON 数据
                if 'application/json' in content_type:
                    json_data = await request.json()
                    response = await client.post(target_url, json=json_data, headers=request.headers, stream=True)

                # 处理 URL 编码的表单数据
                elif 'application/x-www-form-urlencoded' in content_type:
                    form_data = dict(await request.form())
                    response = await client.post(target_url, data=form_data, headers=request.headers, stream=True)

                # 处理 multipart/form-data 表单数据
                elif 'multipart/form-data' in content_type:
                    form = await request.form()
                    files = {key: (form[key].filename, await form[key].read()) for key in form if
                             isinstance(form[key], UploadFile)}
                    fields = {key: form[key] for key in form if not isinstance(form[key], UploadFile)}
                    response = await client.post(target_url, data=fields, files=files, headers=request.headers,
                                                 stream=True)

                # 如果没有指定 Content-Type，处理默认的 URL 编码表单数据
                elif content_type == '' or 'text/plain' in content_type:
                    form_data = dict(await request.form())
                    response = await client.post(target_url, data=form_data, headers=request.headers, stream=True)

                else:
                    raise HTTPException(status_code=400, detail="Unsupported Content-Type for POST request")

            # 处理 PUT 请求
            elif request.method == "PUT":
                json_data = await request.json()
                response = await client.put(target_url, json=json_data, headers=request.headers, stream=True)

            # 处理 DELETE 请求
            elif request.method == "DELETE":
                response = await client.delete(target_url, headers=request.headers, stream=True)

            else:
                raise HTTPException(status_code=405, detail="Method not allowed")

        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=str(e))

    return StreamingResponse(response.aiter_bytes(), status_code=response.status_code, headers=dict(response.headers))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
