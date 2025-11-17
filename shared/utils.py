def flatten(x):
    for item in x:
        if isinstance(item, (list, tuple)):
            yield from flatten(item)
        else:
            yield item

def tuple_to_list(x):
    if isinstance(x, tuple):
        return [tuple_to_list(i) for i in x]
    return x

def flatten_tuple_to_list(x):
    if not isinstance(x, tuple):
        return [x]
    return list(flatten(x))