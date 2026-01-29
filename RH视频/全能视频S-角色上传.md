# 全能视频S-角色上传

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /openapi/v2/rhart-video-s/sora-upload-character:
    post:
      summary: 全能视频S-角色上传
      deprecated: false
      description: ''
      tags:
        - 标准模型 API/视频生成/全能视频 S
      parameters:
        - name: Authorization
          in: header
          description: ''
          required: true
          example: Bearer [Your API KEY]
          schema:
            type: string
            default: Bearer [Your API KEY]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                videoUrl:
                  type: string
                  title: 视频链接
              x-apifox-orders:
                - videoUrl
              required:
                - videoUrl
            examples: {}
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  taskId:
                    type: string
                  status:
                    type: string
                  errorCode:
                    type: string
                  errorMessage:
                    type: string
                  results:
                    type: array
                    items:
                      type: object
                      properties:
                        url:
                          type: 'null'
                        outputType:
                          type: string
                        text:
                          type: string
                          title: 响应的文本内容-角色ID
                      x-apifox-orders:
                        - url
                        - outputType
                        - text
                  clientId:
                    type: string
                  promptTips:
                    type: string
                  01KFWF76J93HTNR488MJGZXZN9:
                    type: string
                required:
                  - taskId
                  - status
                  - errorCode
                  - errorMessage
                  - results
                  - clientId
                  - promptTips
                x-apifox-orders:
                  - taskId
                  - status
                  - errorCode
                  - errorMessage
                  - results
                  - clientId
                  - promptTips
                  - 01KFWF76J93HTNR488MJGZXZN9
              example:
                taskId: '2011057215267807233'
                status: SUCCESS
                errorCode: ''
                errorMessage: ''
                results:
                  - url: null
                    outputType: text
                    text: lucyjvhus.ayamesakur
                clientId: ''
                promptTips: ''
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: 标准模型 API/视频生成/全能视频 S
      x-apifox-status: developing
      x-run-in-apifox: https://app.apifox.com/web/project/6103976/apis/api-408241882-run
components:
  schemas: {}
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []

```
