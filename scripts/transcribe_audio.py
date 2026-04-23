#!/usr/bin/env python3
import argparse
import pathlib
import whisper


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcribe audio with OpenAI Whisper.")
    parser.add_argument("--input", required=True, help="Input audio file path")
    parser.add_argument("--output", required=True, help="Output transcript file path")
    parser.add_argument("--model", default="tiny", help="Whisper model name")
    parser.add_argument("--language", help="Optional language hint")
    args = parser.parse_args()

    model = whisper.load_model(args.model)
    transcribe_kwargs = {
        "fp16": False,
        "task": "transcribe",
    }
    if args.language:
        transcribe_kwargs["language"] = args.language
    result = model.transcribe(args.input, **transcribe_kwargs)
    transcript = (result.get("text") or "").strip()

    output_path = pathlib.Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(transcript + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
