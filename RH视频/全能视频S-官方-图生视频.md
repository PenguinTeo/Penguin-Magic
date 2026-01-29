# 全能视频S-官方-图生视频

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /openapi/v2/rhart-video-s-official/image-to-video:
    post:
      summary: 全能视频S-官方-图生视频
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
                imageUrl:
                  type: string
                  title: 图片地址
                duration:
                  type: string
                  title: 视频时长
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
              x-apifox-orders:
                - prompt
                - imageUrl
                - duration
              required:
                - prompt
                - imageUrl
                - duration
              x-apifox-ignore-properties: []
            example:
              prompt: >-
                动作描述：
                小狗突然冲向地上的橡胶球，兴奋地用前爪猛拍，接着翻滚扑咬，叼起球后甩头狂摇，最后仰躺在地，四爪紧抱球，欢快地用后腿蹬踹，尾巴高速拍打地板。
                环境音效：
                小狗发出一连串激动的“汪汪！”（短促、高亢、充满活力）；前爪拍打地板和球的“啪嗒-啪嗒”声；橡胶球被滚动时发出的轻微“咕噜噜”摩擦声；远处壁炉旁老式座钟清晰而规律的“滴答…滴答…”声。
                角色发声：
                （无人类语言，仅包含狗狗的完整声音表现）：兴奋的“嗷呜！嗷呜！”、成功抢到球后喉咙里发出的满足低吼“嗯～～～”，以及用力蹬腿时伴随的一声短促呼气“哈！”
              duration: '4'
              imageUrl: >-
                https://www.runninghub.cn/view?filename=0682559f66cd5fa000f407e6d2cab812381f59fec230618331b8a810f2fe6be3.png&type=input&subfolder=&Rh-Comfy-Auth=eyJ1c2VySWQiOiIzZjY1MTNlNWEwNjY1N2I4OGYyNjU5NTEzYmU3ZDM0YyIsInNpZ25FeHBpcmUiOjE3NjkxNzI5NjYwMTYsInRzIjoxNzY4NTY4MTY2MDE2LCJzaWduIjoiYWJkMTE5MzkzZGRmZmRkYzFlNWZhZTgwMDNkNDgzYzEifQ==&Rh-Identify=3f6513e5a06657b88f2659513be7d34c&rand=0.5705546834574976
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
      x-run-in-apifox: https://app.apifox.com/web/project/6103976/apis/api-407725706-run
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
