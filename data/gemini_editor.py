import base64
import time
import threading
from io import BytesIO

from PIL import Image
import numpy as np
import torch

from google.genai.client import Client
from google.genai.types import (
    Part,
    GenerateContentConfig,
)


#################################################################
#                   图像转换工具函数（RGB 全程）
#################################################################

def tensor_to_bytes(tensor):
    """
    ComfyUI IMAGE tensor → PNG bytes（RGB）。
    不做任何 BGR/RGB 翻转，保证完全无色差。
    """
    if tensor is None:
        raise ValueError("❌ 输入 tensor 为 None")

    arr = (tensor[0].cpu().numpy() * 255).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(arr, mode="RGB")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def bytes_to_tensor(b):
    """
    PNG bytes → ComfyUI tensor (1,H,W,3) RGB。
    不反转通道，不做额外转换。
    """
    img = Image.open(BytesIO(b)).convert("RGB")
    arr = np.array(img).astype(np.float32) / 255.0
    return torch.from_numpy(arr).unsqueeze(0).float()


#################################################################
#                           Gemini 节点
#################################################################

class Gemini3ImageNode:

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "api_key": ("STRING", {"default": "", "multiline": False}),
                "prompt": ("STRING", {"default": "Describe your image...", "multiline": True}),

                # 保持你的 image_size 完全不变
                "image_size": (["1K", "2K", "4K"], {"default": "1K"}),

                # 新增 AUTO（不传比例）
                "aspect_ratio": (
                    [
                        "AUTO",  # ⭐ 新增
                        "1:1", "2:3", "3:2", "3:4", "4:3",
                        "4:5", "5:4", "9:16", "16:9", "21:9"
                    ],
                    {"default": "AUTO"},
                ),

                # 新增本地超时控制
                "timeout_seconds": ("INT", {"default": 60, "min": 10, "max": 600}),

                # 新增重试次数
                "retry_times": ("INT", {"default": 6, "min": 1, "max": 20}),
            },

            # 可选输入图
            "optional": {
                **{f"image_{i:02d}": ("IMAGE",) for i in range(1, 15)}
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    FUNCTION = "generate"
    CATEGORY = "Gemini3"


    #################################################################
    #                           核心函数
    #################################################################

    def generate(
        self,
        api_key,
        prompt,
        image_size,
        aspect_ratio,
        timeout_seconds,
        retry_times,
        **kwargs
    ):

        if not api_key.strip():
            raise ValueError("❌ API Key 不能为空")

        client = Client(api_key=api_key.strip())

        # ---- 准备输入 ----
        parts = []
        for i in range(1, 15):
            tensor = kwargs.get(f"image_{i:02d}")
            if tensor is not None:
                img_bytes = tensor_to_bytes(tensor)
                parts.append(Part.from_bytes(data=img_bytes, mime_type="image/png"))

        if prompt.strip():
            parts.append(prompt)

        if not parts:
            raise ValueError("❌ 必须提供 prompt 或 输入图像")

        #################################################################
        # ⭐ AUTO 比例：如果选择 AUTO → 不传 aspect_ratio
        #################################################################
        image_cfg = {"image_size": image_size}  # ⚠ 保持你的原始值 1K/2K/4K

        if aspect_ratio != "AUTO":
            image_cfg["aspect_ratio"] = aspect_ratio

        gen_config = GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
            max_output_tokens=2048,
            image_config=image_cfg
        )

        #################################################################
        # ⭐ 本地 timeout + retry（不传递给 Google）
        #################################################################

        def run_request():
            return client.models.generate_content(
                model="models/gemini-3-pro-image-preview",
                contents=parts,
                config=gen_config,
            )

        last_error = None

        for _ in range(retry_times):
            result_container = {"response": None, "error": None}

            def worker():
                try:
                    result_container["response"] = run_request()
                except Exception as e:
                    result_container["error"] = e

            thread = threading.Thread(target=worker)
            thread.start()
            thread.join(timeout_seconds)

            # ---- 超时 ----
            if thread.is_alive():
                last_error = TimeoutError(f"⏰ 超过 {timeout_seconds}s 已强制终止")
                continue

            # ---- Google 错误 ----
            if result_container["error"]:
                last_error = result_container["error"]

                if "503" in str(last_error) or "overload" in str(last_error).lower():
                    time.sleep(1.5)
                    continue

                raise last_error

            # ---- 成功 ----
            response = result_container["response"]
            break

        else:
            raise RuntimeError(
                f"🔥 Gemini 连续 {retry_times} 次失败\n最后错误：{last_error}"
            )

        #################################################################
        #                   解析返回
        #################################################################
        content_parts = None

        if hasattr(response, "parts") and response.parts:
            content_parts = response.parts
        elif hasattr(response, "candidates") and response.candidates:
            cand = response.candidates[0]
            if hasattr(cand, "content") and hasattr(cand.content, "parts"):
                content_parts = cand.content.parts

        if not content_parts:
            raise RuntimeError(f"❌ Gemini 未返回图片：\n{response}")

        image_tensor = None
        text_output = ""

        for p in content_parts:
            if getattr(p, "inline_data", None):
                image_tensor = bytes_to_tensor(p.inline_data.data)
            if getattr(p, "text", None):
                text_output += p.text + "\n"

        if image_tensor is None:
            raise RuntimeError("❌ Gemini 返回文本，但没有生成图像")

        return image_tensor, text_output.strip()


#################################################################
#                       节点注册
#################################################################

NODE_CLASS_MAPPINGS = {
    "Gemini3ImageNode": Gemini3ImageNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Gemini3ImageNode": "Gemini 3 Pro Image Preview (API Key)"
}