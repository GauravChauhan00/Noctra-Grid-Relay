import math, re, shutil, uuid, warnings
from pathlib import Path
from typing import Any
import pandas as pd
from fastapi import UploadFile

BASE_DIR = Path(__file__).resolve().parents[1]
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
CLEANED_DIR = STORAGE_DIR / "cleaned"
REPORTS_DIR = STORAGE_DIR / "reports"
for directory in [UPLOAD_DIR, CLEANED_DIR, REPORTS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".xlsx", ".csv"}


def sanitize_filename(filename: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", filename.strip()) or "uploaded_file"


def validate_extension(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError("Only .xlsx and .csv files are supported.")
    return suffix


def save_upload_file(upload_file: UploadFile) -> Path:
    validate_extension(upload_file.filename or "")
    destination = (
        UPLOAD_DIR
        / f'{uuid.uuid4().hex}_{sanitize_filename(upload_file.filename or "uploaded_file")}'
    )
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return destination


def read_dataframe(file_path: str | Path) -> pd.DataFrame:
    path = Path(file_path)
    suffix = validate_extension(path.name)
    df = (
        pd.read_csv(path)
        if suffix == ".csv"
        else pd.read_excel(path, engine="openpyxl")
    )
    if df.empty:
        raise ValueError(
            "Uploaded file is empty. Please upload a file with at least one data row."
        )
    return df


def standardize_column_name(column: Any) -> str:
    text = str(column).strip().lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return re.sub(r"_+", "_", text).strip("_") or "column"


def make_unique_columns(columns: list[str]) -> list[str]:
    seen, unique = {}, []
    for col in columns:
        if col not in seen:
            seen[col] = 0
            unique.append(col)
        else:
            seen[col] += 1
            unique.append(f"{col}_{seen[col]}")
    return unique


def json_safe(value: Any) -> Any:
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def dataframe_preview(df: pd.DataFrame, limit: int = 8) -> list[dict[str, Any]]:
    return [
        {str(k): json_safe(v) for k, v in record.items()}
        for record in df.head(limit).to_dict(orient="records")
    ]


def detect_and_convert_numeric(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for column in out.columns:
        if pd.api.types.is_numeric_dtype(
            out[column]
        ) or pd.api.types.is_datetime64_any_dtype(out[column]):
            continue
        stripped = (
            out[column]
            .dropna()
            .astype(str)
            .str.replace(",", "", regex=False)
            .str.strip()
        )
        if len(stripped) == 0:
            continue
        numeric = pd.to_numeric(stripped, errors="coerce")
        ratio = numeric.notna().sum() / max(len(stripped), 1)
        hint = any(
            t in column.lower()
            for t in [
                "amount",
                "price",
                "sales",
                "revenue",
                "total",
                "qty",
                "quantity",
                "cost",
                "profit",
            ]
        )
        if ratio >= 0.85 or (hint and ratio >= 0.6):
            out[column] = pd.to_numeric(
                out[column].astype(str).str.replace(",", "", regex=False).str.strip(),
                errors="coerce",
            )
    return out


def detect_and_convert_dates(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    out = df.copy()
    date_cols = []
    for column in out.columns:
        if pd.api.types.is_datetime64_any_dtype(out[column]):
            date_cols.append(column)
            continue
        if pd.api.types.is_numeric_dtype(out[column]):
            continue
        non_empty = out[column].dropna().astype(str).str.strip()
        if len(non_empty) == 0:
            continue
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            parsed = pd.to_datetime(out[column], errors="coerce")
        ratio = parsed.notna().sum() / max(len(non_empty), 1)
        hint = any(
            t in column.lower() for t in ["date", "day", "month", "created", "updated"]
        )
        if hint or ratio >= 0.7:
            out[column] = parsed
            date_cols.append(column)
    return out, date_cols


def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    before_rows = int(len(df))
    before_columns = int(len(df.columns))
    before_missing = int(df.isna().sum().sum())
    cleaned = df.copy()
    cleaned.columns = make_unique_columns(
        [standardize_column_name(c) for c in cleaned.columns]
    )
    for column in cleaned.columns:
        if pd.api.types.is_object_dtype(
            cleaned[column]
        ) or pd.api.types.is_string_dtype(cleaned[column]):
            cleaned[column] = (
                cleaned[column]
                .apply(lambda x: x.strip() if isinstance(x, str) else x)
                .replace("", pd.NA)
            )
    empty_columns = [
        column for column in cleaned.columns if cleaned[column].isna().all()
    ]
    if empty_columns:
        cleaned = cleaned.drop(columns=empty_columns)
    cleaned = detect_and_convert_numeric(cleaned)
    cleaned, date_columns = detect_and_convert_dates(cleaned)
    duplicate_rows = int(cleaned.duplicated().sum())
    cleaned = cleaned.drop_duplicates().reset_index(drop=True)
    numeric_columns = list(cleaned.select_dtypes(include="number").columns)
    for column in numeric_columns:
        cleaned[column] = cleaned[column].fillna(0)
    text_columns = []
    for column in cleaned.columns:
        if column in numeric_columns or column in date_columns:
            continue
        text_columns.append(column)
        cleaned[column] = cleaned[column].fillna("Unknown").replace("", "Unknown")
    after_missing = int(cleaned.isna().sum().sum())
    summary = {
        "total_rows_before": before_rows,
        "total_rows_after": int(len(cleaned)),
        "total_columns": before_columns,
        "duplicate_rows_removed": duplicate_rows,
        "empty_columns_removed": len(empty_columns),
        "missing_values_before": before_missing,
        "missing_values_after": after_missing,
        "missing_values_fixed": max(before_missing - after_missing, 0),
        "columns_detected": list(cleaned.columns),
        "numeric_columns": numeric_columns,
        "date_columns": date_columns,
        "text_columns": text_columns,
        "cleaning_actions": [
            "Removed duplicate rows",
            "Removed fully empty columns",
            "Filled empty numeric values with 0",
            "Filled empty text values with Unknown",
            "Trimmed extra spaces",
            "Standardized column names",
            "Detected numeric and date columns where possible",
        ],
    }
    return cleaned, summary


def save_cleaned_files(
    cleaned_df: pd.DataFrame, original_filename: str
) -> tuple[Path, Path]:
    base = Path(sanitize_filename(original_filename)).stem
    unique = f"{uuid.uuid4().hex}_{base}_cleaned"
    excel_path, csv_path = CLEANED_DIR / f"{unique}.xlsx", CLEANED_DIR / f"{unique}.csv"
    cleaned_df.to_excel(excel_path, index=False, engine="openpyxl")
    cleaned_df.to_csv(csv_path, index=False)
    return excel_path, csv_path
