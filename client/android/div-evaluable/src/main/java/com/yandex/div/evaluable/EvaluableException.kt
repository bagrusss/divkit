package com.yandex.div.evaluable

import com.yandex.div.evaluable.internal.Token

internal const val REASON_DIVISION_BY_ZERO = "Division by zero is not supported."
internal const val REASON_EMPTY_ARGUMENT_LIST = "Non empty argument list is required."
internal const val REASON_INTEGER_OVERFLOW = "Integer overflow."
internal const val REASON_OUT_OF_BOUNDS = "Indexes are out of bounds."
internal const val REASON_INDEXES_ORDER = "Indexes should be in ascending order."
internal const val REASON_CONVERT_TO_INTEGER = "Unable to convert value to Integer."
internal const val REASON_CONVERT_TO_NUMBER = "Unable to convert value to Number."
internal const val REASON_CONVERT_TO_BOOLEAN = "Unable to convert value to Boolean."
internal const val REASON_CONVERT_TO_COLOR = "Unable to convert value to Color, expected format #AARRGGBB."
internal const val REASON_OUT_OF_RANGE = "Value out of range 0..1."

open class EvaluableException(
    message: String,
    cause: Exception? = null
) : RuntimeException(message, cause)

class TokenizingException(
    message: String,
    cause: Exception? = null
) : EvaluableException(message, cause)

class MissingVariableException(
    val variableName: String,
    cause: Exception? = null
) : EvaluableException("Variable '${variableName}' is missing", cause)

internal fun throwExceptionOnEvaluationFailed(
    expression: String,
    reason: String,
    cause: Exception? = null
): Nothing = throw EvaluableException("Failed to evaluate [$expression]. $reason", cause)

internal fun throwExceptionOnFunctionEvaluationFailed(
    name: String,
    args: List<Any>,
    reason: String,
    cause: Exception? = null
): Nothing = throwExceptionOnEvaluationFailed(functionToMessageFormat(name, args), reason, cause)


private fun functionToMessageFormat(name: String, args: List<Any>): String {
    return args.joinToString(prefix = "${name}(", postfix = ")") {
        it.toMessageFormat()
    }
}


internal fun throwExceptionOnEvaluationFailed(
    operator: Token.Operator.Binary,
    left: Any,
    right: Any,
): Nothing {
    val evaluable = "${left.toMessageFormat()} $operator ${right.toMessageFormat()}"
    val typesMessage = if (left.javaClass != right.javaClass) {
        "different types: ${EvaluableType.of(left).typeName} and ${EvaluableType.of(right).typeName}"
    } else {
        "${EvaluableType.of(left).typeName} type"
    }
    throwExceptionOnEvaluationFailed(
        evaluable,
        "Operator '$operator' cannot be applied to $typesMessage."
    )
}

internal fun List<Any>.toMessageFormat(): String {
    return this.joinToString(", ") {
        it.toMessageFormat()
    }
}

internal fun Any.toMessageFormat(): String {
    return if (this is String) {
        "'$this'"
    } else {
        toString()
    }
}
