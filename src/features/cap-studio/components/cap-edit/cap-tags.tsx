import {
    Tags,
    TagsContent,
    TagsEmpty,
    TagsGroup,
    TagsInput,
    TagsItem,
    TagsList,
    TagsTrigger,
    TagsValue,
} from '@/shared/components/ui/shadcn-io/tags';
import { predefinedTags } from '@/shared/constants/cap';

interface CapTagsProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

export function CapTags({
    value,
    onChange,
    placeholder = "Search tags..."
}: CapTagsProps) {
    const handleTagsChange = (tagsString: string) => {
        const tags = tagsString
            ? tagsString
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [];
        onChange(tags);
    };

    const handleTagRemove = (tagToRemove: string) => {
        const newTags = value?.filter((t) => t !== tagToRemove) || [];
        onChange(newTags);
    };

    const handleTagSelect = (tag: string) => {
        const currentTags = value || [];
        if (!currentTags.includes(tag)) {
            onChange([...currentTags, tag]);
        }
    };

    return (
        <Tags
            value={value?.join(', ') || ''}
            setValue={handleTagsChange}
        >
            <TagsTrigger>
                {value && value.length > 0
                    ? value.map((tag) => (
                        <TagsValue
                            key={tag}
                            onRemove={() => handleTagRemove(tag)}
                        >
                            {tag}
                        </TagsValue>
                    ))
                    : null}
            </TagsTrigger>
            <TagsContent>
                <TagsInput placeholder={placeholder} />
                <TagsList>
                    <TagsEmpty>No tags found.</TagsEmpty>
                    <TagsGroup>
                        {predefinedTags.map((tag) => (
                            <TagsItem
                                key={tag}
                                onSelect={() => handleTagSelect(tag)}
                            >
                                {tag}
                            </TagsItem>
                        ))}
                    </TagsGroup>
                </TagsList>
            </TagsContent>
        </Tags>
    );
} 