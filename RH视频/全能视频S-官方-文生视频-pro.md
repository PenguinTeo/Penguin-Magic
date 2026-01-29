# 全能视频S-官方-文生视频-pro

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /openapi/v2/rhart-video-s-official/text-to-video-pro:
    post:
      summary: 全能视频S-官方-文生视频-pro
      deprecated: false
      description: ''
      tags:
        - 标准模型 API/视频生成/全能视频 S
      parameters:
        - name: Content-Type
          in: header
          description: ''
          required: false
          example: application/json
          schema:
            type: string
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
                prompt:
                  type: string
                  title: 提示词
                duration:
                  type: string
                  title: 时长
                  enum:
                    - '4'
                    - '8'
                    - '12'
                  x-apifox-enum:
                    - value: '4'
                      name: ''
                      description: ''
                    - value: '8'
                      name: ''
                      description: ''
                    - value: '12'
                      name: ''
                      description: ''
                  default: '4'
                size:
                  type: string
                  title: 视频尺寸
                  enum:
                    - 720x1280
                    - 1280x720
                    - 1024x1792
                    - 1792x1024
                  x-apifox-enum:
                    - value: 720x1280
                      name: ''
                      description: ''
                    - value: 1280x720
                      name: ''
                      description: ''
                    - value: 1024x1792
                      name: ''
                      description: ''
                    - value: 1792x1024
                      name: ''
                      description: ''
                  default: '9:16'
              x-apifox-orders:
                - prompt
                - duration
                - size
              required:
                - prompt
                - duration
                - size
              x-apifox-ignore-properties: []
            example:
              prompt: a dog is singing and dancing
              model: s-pro-portrait-25s
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: >-
                  #/components/schemas/%E7%94%9F%E6%88%90%E4%BB%BB%E5%8A%A1%E6%8F%90%E4%BA%A4%E7%BB%93%E6%9E%9C
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: 标准模型 API/视频生成/全能视频 S
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/6103976/apis/api-407729959-run
components:
  schemas:
    生成任务提交结果:
      type: object
      properties:
        taskId:
          type: string
          title: 任务ID
        status:
          type: string
          title: 状态
          enum:
            - QUEUED
            - RUNNING
            - FAILED
            - SUCCESS
          x-apifox-enum:
            - value: QUEUED
              name: 进入执行队列
              description: ''
            - value: RUNNING
              name: 运行中
              description: ''
            - value: FAILED
              name: 失败
              description: ''
            - value: SUCCESS
              name: 成功
              description: ''
        errorCode:
          type: string
          title: 错误码
          nullable: true
        errorMessage:
          type: string
          title: 错误信息
          nullable: true
        results:
          type: array
          items:
            type: object
            properties:
              url:
                type: string
                title: 结果链接
              outputType:
                type: string
                title: 输出类型
            x-apifox-orders:
              - url
              - outputType
            required:
              - url
              - outputType
            x-apifox-ignore-properties: []
          title: 结果
        clientId:
          type: string
          nullable: true
        promptTips:
          type: string
          nullable: true
        failedReason:
          type: string
          description: comfyUI 相关的失败原因
        usage:
          type: object
          properties:
            thirdPartyConsumeMoney:
              type: string
              title: API消费金额
            consumeMoney:
              type: string
              title: 运行时长消耗金额
            consumeCoins:
              type: string
              title: 运行消耗的RH币
            taskCostTime:
              type: string
              title: 运行耗时
              description: 工作流相关
          x-apifox-orders:
            - thirdPartyConsumeMoney
            - consumeMoney
            - consumeCoins
            - taskCostTime
          description: 用量
          required:
            - thirdPartyConsumeMoney
            - consumeMoney
            - consumeCoins
            - taskCostTime
          x-apifox-ignore-properties: []
      required:
        - taskId
        - status
        - errorCode
        - errorMessage
        - results
        - clientId
        - promptTips
        - failedReason
        - usage
      x-apifox-orders:
        - taskId
        - status
        - errorCode
        - errorMessage
        - results
        - clientId
        - promptTips
        - failedReason
        - usage
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes: {}
servers:
  - url: https://www.runninghub.cn
    description: runninghub.cn
security: []

```
